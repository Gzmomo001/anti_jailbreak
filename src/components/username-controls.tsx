"use client";

import { LoaderCircle, Pencil, RefreshCw, X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import {
  changeUsernameAction,
  retryModerationAction,
} from "@/app/actions/username";
import { initialActionState } from "@/lib/action-state";

export function UsernameControls({
  canRetry,
  adminEmail,
}: {
  canRetry: boolean;
  adminEmail: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(
    changeUsernameAction,
    initialActionState,
  );
  const [retryPending, startRetry] = useTransition();
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  return (
    <div className="mt-5 border-t border-[#eef1f0] pt-5">
      {editing ? (
        <form action={action} className="max-w-lg">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="new-username" className="text-sm font-semibold">
              新用户名
            </label>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-[4px] text-[#626a67] hover:bg-[#eef1f0]"
              onClick={() => setEditing(false)}
              aria-label="关闭用户名编辑"
              title="关闭"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              className="field-input"
              id="new-username"
              name="username"
              minLength={2}
              maxLength={20}
              pattern="[\p{L}\p{N}_-]+"
              autoComplete="username"
              required
              aria-describedby="new-username-help"
            />
            <button
              className="primary-button shrink-0"
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 animate-spin"
                />
              ) : null}
              提交审核
            </button>
          </div>
          <p id="new-username-help" className="mt-1.5 text-xs text-[#626a67]">
            新名称通过前，当前已发布名称保持可见。
          </p>
          {state.message ? (
            <p
              className={`mt-2 text-sm ${
                state.status === "error" ? "text-[#c92f3d]" : "text-[#087f68]"
              }`}
              role="status"
            >
              {state.message}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden="true" className="size-4" />
            修改用户名
          </button>

          {canRetry ? (
            <button
              className="danger-button"
              type="button"
              disabled={retryPending}
              onClick={() =>
                startRetry(async () => {
                  const result = await retryModerationAction();
                  setRetryMessage(result.message ?? null);
                })
              }
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-4 ${retryPending ? "animate-spin" : ""}`}
              />
              重新审核
            </button>
          ) : null}
        </div>
      )}

      {canRetry ? (
        <p className="mt-3 text-sm text-[#626a67]">
          仍有问题？联系管理员：
          <a
            className="font-semibold text-[#087f68] underline underline-offset-2"
            href={`mailto:${adminEmail}`}
          >
            {adminEmail}
          </a>
        </p>
      ) : null}
      {retryMessage ? (
        <p className="mt-2 text-sm text-[#087f68]" role="status">
          {retryMessage}
        </p>
      ) : null}
    </div>
  );
}
