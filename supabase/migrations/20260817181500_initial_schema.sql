create extension if not exists pgcrypto;
create extension if not exists pgmq;

do $$
begin
  perform pgmq.create('username_moderation');
exception
  when unique_violation then null;
end
$$;

create type public.moderation_state as enum (
  'pending',
  'approved',
  'rejected',
  'needs_human_review',
  'error'
);

create type public.moderation_decision as enum (
  'approve',
  'reject',
  'human_review',
  'provider_error'
);

create type public.resource_access_mode as enum (
  'authenticated',
  'explicit'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  published_username text,
  published_username_normalized text,
  pending_username text,
  pending_username_normalized text,
  moderation_state public.moderation_state not null default 'pending',
  moderation_revision integer not null default 0 check (moderation_revision >= 0),
  moderation_reason text,
  moderation_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.username_reservations (
  normalized_username text primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  reservation_kind text not null check (reservation_kind in ('published', 'pending')),
  display_username text not null,
  created_at timestamptz not null default now(),
  unique (account_id, reservation_kind)
);

create index username_reservations_account_id_idx
  on public.username_reservations(account_id);

create table public.moderation_jobs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  revision integer not null check (revision > 0),
  username_snapshot text not null,
  normalized_username_snapshot text not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'completed', 'stale', 'error')),
  decision public.moderation_decision,
  reason text,
  attempts integer not null default 0 check (attempts >= 0),
  queue_message_id bigint,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  unique (account_id, revision)
);

create index moderation_jobs_account_id_created_at_idx
  on public.moderation_jobs(account_id, created_at desc);

create index moderation_jobs_status_created_at_idx
  on public.moderation_jobs(status, created_at);

create table public.visible_members (
  account_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  normalized_username text not null unique,
  published_at timestamptz not null default now()
);

create table public.worker_leases (
  lease_name text primary key,
  owner text not null,
  lease_until timestamptz not null,
  updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  content text not null,
  access_mode public.resource_access_mode not null,
  version text not null,
  document_size text not null,
  updated_at timestamptz not null default now()
);

create table public.resource_permissions (
  account_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (account_id, resource_id)
);

create index resource_permissions_resource_id_idx
  on public.resource_permissions(resource_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.request_username_change(
  p_username text,
  p_normalized text
)
returns public.profiles
language plpgsql
security definer
set search_path = public, pgmq, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles;
  v_job_id uuid;
  v_message_id bigint;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  p_username := normalize(btrim(p_username), NFKC);
  p_normalized := lower(p_username);

  if p_username is null
     or char_length(p_username) < 2 or char_length(p_username) > 20
     or p_username !~ '^[[:alnum:]_-]+$' then
    raise exception using errcode = '22023', message = 'invalid_username';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_actor
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'profile_not_found';
  end if;

  if v_profile.published_username_normalized = p_normalized then
    raise exception using errcode = '22023', message = 'username_unchanged';
  end if;

  if v_profile.pending_username_normalized is null then
    begin
      insert into public.username_reservations(
        normalized_username,
        account_id,
        reservation_kind,
        display_username
      )
      values (p_normalized, v_actor, 'pending', p_username);
    exception
      when unique_violation then
        raise exception using errcode = '23505', message = 'username_taken';
    end;
  elsif v_profile.pending_username_normalized = p_normalized then
    update public.username_reservations
    set display_username = p_username
    where account_id = v_actor and reservation_kind = 'pending';
  else
    begin
      update public.username_reservations
      set normalized_username = p_normalized,
          display_username = p_username,
          created_at = now()
      where account_id = v_actor and reservation_kind = 'pending';
    exception
      when unique_violation then
        raise exception using errcode = '23505', message = 'username_taken';
    end;
  end if;

  perform pgmq.delete('username_moderation', queue_message_id)
  from public.moderation_jobs
  where account_id = v_actor
    and status in ('queued', 'processing')
    and queue_message_id is not null;

  update public.moderation_jobs
  set status = 'stale',
      finished_at = now()
  where account_id = v_actor
    and status in ('queued', 'processing');

  update public.profiles
  set pending_username = p_username,
      pending_username_normalized = p_normalized,
      moderation_state = 'pending',
      moderation_reason = null,
      moderation_revision = moderation_revision + 1,
      moderation_updated_at = now()
  where id = v_actor
  returning * into v_profile;

  insert into public.moderation_jobs(
    account_id,
    revision,
    username_snapshot,
    normalized_username_snapshot
  )
  values (
    v_actor,
    v_profile.moderation_revision,
    p_username,
    p_normalized
  )
  returning id into v_job_id;

  select pgmq.send(
    'username_moderation',
    jsonb_build_object('job_id', v_job_id)
  ) into v_message_id;

  update public.moderation_jobs
  set queue_message_id = v_message_id
  where id = v_job_id;

  return v_profile;
end;
$$;

create or replace function public.retry_username_moderation()
returns public.profiles
language plpgsql
security definer
set search_path = public, pgmq, auth
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles;
  v_job_id uuid;
  v_message_id bigint;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'authentication_required';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_actor
  for update;

  if not found or v_profile.moderation_state <> 'error'
     or v_profile.pending_username is null then
    raise exception using errcode = '22023', message = 'retry_not_allowed';
  end if;

  perform pgmq.delete('username_moderation', queue_message_id)
  from public.moderation_jobs
  where account_id = v_actor
    and status in ('queued', 'processing')
    and queue_message_id is not null;

  update public.moderation_jobs
  set status = 'stale',
      finished_at = now()
  where account_id = v_actor
    and status in ('queued', 'processing');

  update public.profiles
  set moderation_state = 'pending',
      moderation_reason = null,
      moderation_revision = moderation_revision + 1,
      moderation_updated_at = now()
  where id = v_actor
  returning * into v_profile;

  insert into public.moderation_jobs(
    account_id,
    revision,
    username_snapshot,
    normalized_username_snapshot
  )
  values (
    v_actor,
    v_profile.moderation_revision,
    v_profile.pending_username,
    v_profile.pending_username_normalized
  )
  returning id into v_job_id;

  select pgmq.send(
    'username_moderation',
    jsonb_build_object('job_id', v_job_id)
  ) into v_message_id;

  update public.moderation_jobs
  set queue_message_id = v_message_id
  where id = v_job_id;

  return v_profile;
end;
$$;

create or replace function public.acquire_worker_lease(
  p_owner text,
  p_lease_seconds integer default 90
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_acquired boolean := false;
begin
  insert into public.worker_leases(lease_name, owner, lease_until)
  values (
    'username_moderation',
    p_owner,
    now() + make_interval(secs => greatest(p_lease_seconds, 10))
  )
  on conflict (lease_name) do update
  set owner = excluded.owner,
      lease_until = excluded.lease_until,
      updated_at = now()
  where public.worker_leases.lease_until < now()
     or public.worker_leases.owner = excluded.owner
  returning true into v_acquired;

  return coalesce(v_acquired, false);
end;
$$;

create or replace function public.release_worker_lease(p_owner text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.worker_leases
  where lease_name = 'username_moderation'
    and owner = p_owner;
$$;

create or replace function public.claim_next_moderation_job(
  p_visibility_timeout integer default 120
)
returns table (
  job_id uuid,
  account_id uuid,
  revision integer,
  username_snapshot text
)
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_message record;
  v_job public.moderation_jobs;
  v_skipped integer;
begin
  for v_skipped in 1..25 loop
    select * into v_message
    from pgmq.read(
      'username_moderation',
      greatest(p_visibility_timeout, 30),
      1
    )
    limit 1;

    if not found then
      return;
    end if;

    select * into v_job
    from public.moderation_jobs
    where id = (v_message.message ->> 'job_id')::uuid
    for update;

    if found and v_job.status in ('queued', 'processing') then
      update public.moderation_jobs
      set status = 'processing',
          attempts = attempts + 1,
          started_at = now(),
          queue_message_id = v_message.msg_id
      where id = v_job.id;

      return query
      select
        v_job.id,
        v_job.account_id,
        v_job.revision,
        v_job.username_snapshot;
      return;
    end if;

    perform pgmq.delete('username_moderation', v_message.msg_id);
  end loop;
end;
$$;

create or replace function public.complete_moderation_job(
  p_job_id uuid,
  p_decision public.moderation_decision,
  p_reason text
)
returns text
language plpgsql
security definer
set search_path = public, pgmq
as $$
declare
  v_job public.moderation_jobs;
  v_profile public.profiles;
  v_state public.moderation_state;
begin
  select * into v_job
  from public.moderation_jobs
  where id = p_job_id
  for update;

  if not found then
    return 'missing';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_job.account_id
  for update;

  if not found
     or v_job.revision <> v_profile.moderation_revision
     or v_job.normalized_username_snapshot
        is distinct from v_profile.pending_username_normalized then
    update public.moderation_jobs
    set status = 'stale',
        reason = 'Superseded by a newer username revision',
        finished_at = now()
    where id = p_job_id;

    if v_job.queue_message_id is not null then
      perform pgmq.delete('username_moderation', v_job.queue_message_id);
    end if;

    return 'stale';
  end if;

  if p_decision = 'approve' then
    delete from public.username_reservations
    where account_id = v_job.account_id
      and reservation_kind = 'published';

    update public.username_reservations
    set reservation_kind = 'published',
        display_username = v_profile.pending_username
    where account_id = v_job.account_id
      and reservation_kind = 'pending';

    insert into public.visible_members(
      account_id,
      username,
      normalized_username,
      published_at
    )
    values (
      v_job.account_id,
      v_profile.pending_username,
      v_profile.pending_username_normalized,
      now()
    )
    on conflict (account_id) do update
    set username = excluded.username,
        normalized_username = excluded.normalized_username,
        published_at = now();

    update public.profiles
    set published_username = pending_username,
        published_username_normalized = pending_username_normalized,
        pending_username = null,
        pending_username_normalized = null,
        moderation_state = 'approved',
        moderation_reason = p_reason,
        moderation_updated_at = now()
    where id = v_job.account_id;

    v_state := 'approved';
  elsif p_decision = 'reject' then
    v_state := 'rejected';
  elsif p_decision = 'human_review' then
    v_state := 'needs_human_review';
  else
    v_state := 'error';
  end if;

  if p_decision <> 'approve' then
    update public.profiles
    set moderation_state = v_state,
        moderation_reason = p_reason,
        moderation_updated_at = now()
    where id = v_job.account_id;
  end if;

  update public.moderation_jobs
  set status = case when p_decision = 'provider_error' then 'error' else 'completed' end,
      decision = p_decision,
      reason = p_reason,
      finished_at = now()
  where id = p_job_id;

  if v_job.queue_message_id is not null then
    perform pgmq.delete('username_moderation', v_job.queue_message_id);
  end if;

  return v_state::text;
end;
$$;

alter table public.profiles enable row level security;
alter table public.username_reservations enable row level security;
alter table public.moderation_jobs enable row level security;
alter table public.visible_members enable row level security;
alter table public.worker_leases enable row level security;
alter table public.resources enable row level security;
alter table public.resource_permissions enable row level security;

create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy reservations_select_own
on public.username_reservations for select
to authenticated
using (account_id = (select auth.uid()));

create policy moderation_jobs_select_own
on public.moderation_jobs for select
to authenticated
using (account_id = (select auth.uid()));

create policy visible_members_select_authenticated
on public.visible_members for select
to authenticated
using (true);

create policy resource_permissions_select_own
on public.resource_permissions for select
to authenticated
using (account_id = (select auth.uid()));

create policy resources_select_authorized
on public.resources for select
to authenticated
using (
  access_mode = 'authenticated'
  or exists (
    select 1
    from public.resource_permissions permission
    where permission.account_id = (select auth.uid())
      and permission.resource_id = resources.id
  )
);

revoke all on public.profiles from anon;
revoke all on public.username_reservations from anon;
revoke all on public.moderation_jobs from anon;
revoke all on public.visible_members from anon;
revoke all on public.worker_leases from anon, authenticated;
revoke all on public.resources from anon;
revoke all on public.resource_permissions from anon;

grant select on public.profiles to authenticated;
grant select on public.username_reservations to authenticated;
grant select on public.moderation_jobs to authenticated;
grant select on public.visible_members to authenticated;
grant select on public.resources to authenticated;
grant select on public.resource_permissions to authenticated;

revoke all on function public.request_username_change(text, text) from public;
revoke all on function public.retry_username_moderation() from public;
revoke all on function public.acquire_worker_lease(text, integer) from public;
revoke all on function public.release_worker_lease(text) from public;
revoke all on function public.claim_next_moderation_job(integer) from public;
revoke all on function public.complete_moderation_job(
  uuid,
  public.moderation_decision,
  text
) from public;

grant execute on function public.request_username_change(text, text)
  to authenticated;
grant execute on function public.retry_username_moderation()
  to authenticated;
grant execute on function public.acquire_worker_lease(text, integer)
  to service_role;
grant execute on function public.release_worker_lease(text)
  to service_role;
grant execute on function public.claim_next_moderation_job(integer)
  to service_role;
grant execute on function public.complete_moderation_job(
  uuid,
  public.moderation_decision,
  text
) to service_role;

insert into public.resources(
  slug,
  title,
  summary,
  content,
  access_mode,
  version,
  document_size,
  updated_at
)
values
  (
    'a',
    '资源 A：项目需求文档',
    '所有登录用户均可查看的产品需求摘要。',
    'Gatehouse 资源 A 包含项目背景、核心用户流程和公开验收标准。该资源用于验证默认登录授权。',
    'authenticated',
    'v2.1',
    '1.2 MB',
    '2026-08-16T09:15:00Z'
  ),
  (
    'b',
    '资源 B：内部风险报告',
    '仅向显式授权账号开放的内部风险评估。',
    'Gatehouse 资源 B 包含审核失败模式、授权风险和内部处置建议。普通登录用户默认无权访问。',
    'explicit',
    'v1.0',
    '842 KB',
    '2026-08-16T10:30:00Z'
  );
