"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { wakeModerationWorker } from "@/lib/moderation/wake-worker";
import { createClient } from "@/lib/supabase/server";
import { registerAccount } from "@/modules/account-registration/register";

const loginSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  password: z.string().min(1, "请输入密码"),
});

const registrationSchema = loginSchema.extend({
  password: z.string().min(8, "密码至少需要 8 位"),
  username: z.string().min(1, "请输入用户名"),
});

function errorState(error: z.ZodError): ActionState {
  return {
    status: "error",
    message: "请检查表单内容",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: "邮箱或密码不正确",
    };
  }

  redirect("/dashboard");
}

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return errorState(parsed.error);

  const supabase = await createClient();
  let usernameSetupFailed = false;

  try {
    const result = await registerAccount(supabase, parsed.data);

    if (result.kind === "failed") {
      return { status: "error", message: result.reason };
    }

    if (result.kind === "account_created_username_failed") {
      usernameSetupFailed = true;
    } else {
      after(async () => {
        await wakeModerationWorker(result.accessToken).catch(() => undefined);
      });
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "注册失败，请稍后重试",
    };
  }

  redirect(
    usernameSetupFailed
      ? "/dashboard?notice=username-setup-failed"
      : "/dashboard",
  );
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
