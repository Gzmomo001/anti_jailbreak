revoke all on function public.handle_new_user()
  from public, anon, authenticated, service_role;

revoke all on function public.request_username_change(text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.retry_username_moderation()
  from public, anon, authenticated, service_role;

revoke all on function public.acquire_worker_lease(text, integer)
  from public, anon, authenticated, service_role;
revoke all on function public.release_worker_lease(text)
  from public, anon, authenticated, service_role;
revoke all on function public.claim_next_moderation_job(integer)
  from public, anon, authenticated, service_role;
revoke all on function public.complete_moderation_job(
  uuid,
  public.moderation_decision,
  text
) from public, anon, authenticated, service_role;

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
