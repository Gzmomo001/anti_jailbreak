import type { SupabaseClient } from "@supabase/supabase-js";

import { parseUsername } from "@/modules/username-lifecycle/domain";

type RegistrationInput = {
  email: string;
  password: string;
  username: string;
};

export type RegistrationResult =
  | { kind: "registered"; accountId: string; accessToken: string }
  | { kind: "account_created_username_failed"; accountId: string; reason: string }
  | { kind: "failed"; reason: string };

export async function registerAccount(
  supabase: SupabaseClient,
  input: RegistrationInput,
): Promise<RegistrationResult> {
  const parsedUsername = parseUsername(input.username);
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error || !data.user || !data.session) {
    return {
      kind: "failed",
      reason: error?.message ?? "注册失败，请稍后重试",
    };
  }

  const { error: usernameError } = await supabase.rpc(
    "request_username_change",
    {
      p_username: parsedUsername.display,
      p_normalized: parsedUsername.normalized,
    },
  );

  if (usernameError) {
    return {
      kind: "account_created_username_failed",
      accountId: data.user.id,
      reason: usernameError.message,
    };
  }

  return {
    kind: "registered",
    accountId: data.user.id,
    accessToken: data.session.access_token,
  };
}
