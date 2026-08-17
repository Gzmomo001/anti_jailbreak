"use client";

import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, User } from "lucide-react";
import { useActionState, useId, useState } from "react";

import { loginAction, registerAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";

type Mode = "login" | "register";

function FieldError({
  id,
  errors,
}: {
  id: string;
  errors: string[] | undefined;
}) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-[#c92f3d]">
      {errors[0]}
    </p>
  );
}

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initialActionState,
  );
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initialActionState,
  );
  const id = useId();
  const state = mode === "login" ? loginState : registerState;
  const pending = mode === "login" ? loginPending : registerPending;
  const action = mode === "login" ? loginFormAction : registerFormAction;
  const emailErrorId = `${id}-email-error`;
  const passwordErrorId = `${id}-password-error`;
  const usernameErrorId = `${id}-username-error`;

  return (
    <div className="w-full">
      <div
        className="mb-7 grid grid-cols-2 border-b border-[#dce1df]"
        aria-label="账户操作模式"
      >
        {(["login", "register"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            className={`min-h-12 border-b-2 px-4 font-semibold transition-colors ${
              mode === value
                ? "border-[#087f68] text-[#087f68]"
                : "border-transparent text-[#626a67] hover:text-[#151817]"
            }`}
            onClick={() => setMode(value)}
          >
            {value === "login" ? "登录" : "注册"}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-bold leading-tight">
        {mode === "login" ? "欢迎回来" : "创建 Gatehouse 账户"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#626a67]">
        {mode === "login"
          ? "使用邮箱和密码进入工作台。"
          : "注册完成后即可登录，用户名将在后台审核。"}
      </p>

      <form action={action} className="mt-7 space-y-5">
        {mode === "register" ? (
          <div>
            <label htmlFor={`${id}-username`} className="text-sm font-semibold">
              用户名
            </label>
            <div className="relative mt-2">
              <User
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#626a67]"
              />
              <input
                className="field-input pl-10"
                id={`${id}-username`}
                name="username"
                type="text"
                autoComplete="username"
                minLength={2}
                maxLength={20}
                pattern="[\p{L}\p{N}_-]+"
                required
                enterKeyHint="next"
                aria-invalid={Boolean(state.fieldErrors?.username)}
                aria-describedby={
                  state.fieldErrors?.username
                    ? usernameErrorId
                    : `${id}-username-help`
                }
              />
            </div>
            <p id={`${id}-username-help`} className="mt-1.5 text-xs text-[#626a67]">
              2–20 个字符，支持中文、英文、数字、下划线和连字符。
            </p>
            <FieldError
              id={usernameErrorId}
              errors={state.fieldErrors?.username}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor={`${id}-email`} className="text-sm font-semibold">
            邮箱
          </label>
          <div className="relative mt-2">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#626a67]"
            />
            <input
              className="field-input pl-10"
              id={`${id}-email`}
              name="email"
              type="email"
              autoComplete="username"
              required
              enterKeyHint="next"
              aria-invalid={Boolean(state.fieldErrors?.email)}
              aria-describedby={
                state.fieldErrors?.email ? emailErrorId : undefined
              }
            />
          </div>
          <FieldError id={emailErrorId} errors={state.fieldErrors?.email} />
        </div>

        <div>
          <label htmlFor={`${id}-password`} className="text-sm font-semibold">
            密码
          </label>
          <div className="relative mt-2">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#626a67]"
            />
            <input
              className="field-input px-10"
              id={`${id}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "register" ? 8 : undefined}
              required
              enterKeyHint="done"
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={
                state.fieldErrors?.password ? passwordErrorId : undefined
              }
            />
            <button
              type="button"
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[4px] text-[#626a67] hover:bg-[#eef1f0] hover:text-[#151817]"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
          <FieldError
            id={passwordErrorId}
            errors={state.fieldErrors?.password}
          />
        </div>

        {state.status === "error" ? (
          <div
            className="border-l-2 border-[#dc3f4c] bg-[#fff0f1] px-3 py-2.5 text-sm text-[#9f2430]"
            role="alert"
            aria-live="assertive"
          >
            {state.message}
          </div>
        ) : null}

        <button className="primary-button w-full" type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : null}
          {mode === "login" ? "进入工作台" : "创建账户"}
        </button>
      </form>

      {mode === "register" ? (
        <p className="mt-5 text-center text-xs leading-5 text-[#626a67]">
          用户名将在后台完成社区规范审核，账户创建过程不会等待模型返回。
        </p>
      ) : null}
    </div>
  );
}
