"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionState } from "@/lib/action-state";
import { wakeModerationWorker } from "@/lib/moderation/wake-worker";
import { createClient } from "@/lib/supabase/server";
import { parseUsername } from "@/modules/username-lifecycle/domain";

const usernameSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("请先登录");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("登录会话已失效");
  }

  return { supabase, user, accessToken: session.access_token };
}

export async function changeUsernameAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = usernameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "请检查用户名",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const username = parseUsername(parsed.data.username);
    const { supabase, accessToken } = await requireUser();
    const { error } = await supabase.rpc("request_username_change", {
      p_username: username.display,
      p_normalized: username.normalized,
    });

    if (error) {
      const message = error.message.includes("username_taken")
        ? "该用户名已被占用"
        : error.message.includes("username_unchanged")
          ? "新用户名不能与当前用户名相同"
          : "用户名提交失败，请稍后重试";
      return { status: "error", message };
    }
    after(async () => {
      await wakeModerationWorker(accessToken).catch(() => undefined);
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "用户名提交失败",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/members");
  return { status: "success", message: "新用户名已进入审核队列" };
}

export async function retryModerationAction(): Promise<ActionState> {
  try {
    const { supabase, accessToken } = await requireUser();
    const { error } = await supabase.rpc("retry_username_moderation");

    if (error) {
      return { status: "error", message: "当前状态无法重新审核" };
    }

    after(async () => {
      await wakeModerationWorker(accessToken).catch(() => undefined);
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "重试失败",
    };
  }

  revalidatePath("/dashboard");
  return { status: "success", message: "审核任务已重新加入队列" };
}
