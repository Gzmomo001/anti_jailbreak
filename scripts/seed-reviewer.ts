import { createClient } from "@supabase/supabase-js";

const email =
  process.env.REVIEWER_EMAIL ?? "resource-b-reviewer@demo.henry070.org";
const password = process.env.REVIEWER_PASSWORD ?? "Gatehouse-B-2026!";
const username = "resource_b_reviewer";
const normalizedUsername = username.toLowerCase();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: users, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) throw listError;

let account = users.users.find((user) => user.email === email);

if (!account) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  account = data.user;
} else {
  const { error } = await admin.auth.admin.updateUserById(account.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
}

const { data: resourceB, error: resourceError } = await admin
  .from("resources")
  .select("id")
  .eq("slug", "b")
  .single();

if (resourceError) throw resourceError;

const { error: reservationError } = await admin
  .from("username_reservations")
  .upsert(
    {
      normalized_username: normalizedUsername,
      account_id: account.id,
      reservation_kind: "published",
      display_username: username,
    },
    { onConflict: "normalized_username" },
  );

if (reservationError) throw reservationError;

const { error: profileError } = await admin.from("profiles").upsert({
  id: account.id,
  published_username: username,
  published_username_normalized: normalizedUsername,
  pending_username: null,
  pending_username_normalized: null,
  moderation_state: "approved",
  moderation_revision: 1,
  moderation_reason: "预置资源 B 测试账号",
  moderation_updated_at: new Date().toISOString(),
});

if (profileError) throw profileError;

const { error: memberError } = await admin.from("visible_members").upsert({
  account_id: account.id,
  username,
  normalized_username: normalizedUsername,
  published_at: new Date().toISOString(),
});

if (memberError) throw memberError;

const { error: permissionError } = await admin
  .from("resource_permissions")
  .upsert({
    account_id: account.id,
    resource_id: resourceB.id,
  });

if (permissionError) throw permissionError;

console.log(`Reviewer account ready: ${email}`);
