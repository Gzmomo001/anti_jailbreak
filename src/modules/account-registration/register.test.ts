import { describe, expect, it, vi } from "vitest";

import { registerAccount } from "./register";

function createSupabaseStub({
  signUpResult,
  rpcResult = { error: null },
}: {
  signUpResult: unknown;
  rpcResult?: unknown;
}) {
  return {
    auth: {
      signUp: vi.fn().mockResolvedValue(signUpResult),
    },
    rpc: vi.fn().mockResolvedValue(rpcResult),
  };
}

describe("registerAccount", () => {
  it("creates the account and submits the normalized username", async () => {
    const supabase = createSupabaseStub({
      signUpResult: {
        data: {
          user: { id: "account-1" },
          session: { access_token: "access-token" },
        },
        error: null,
      },
    });

    const result = await registerAccount(supabase as never, {
      email: "member@example.com",
      password: "password123",
      username: "  Ａlice_01  ",
    });

    expect(result).toEqual({
      kind: "registered",
      accountId: "account-1",
      accessToken: "access-token",
    });
    expect(supabase.rpc).toHaveBeenCalledWith("request_username_change", {
      p_username: "Alice_01",
      p_normalized: "alice_01",
    });
  });

  it("returns an auth failure without submitting a username", async () => {
    const supabase = createSupabaseStub({
      signUpResult: {
        data: { user: null, session: null },
        error: { message: "Email already registered" },
      },
    });

    const result = await registerAccount(supabase as never, {
      email: "member@example.com",
      password: "password123",
      username: "Alice",
    });

    expect(result).toEqual({
      kind: "failed",
      reason: "Email already registered",
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns a recoverable result when username setup fails", async () => {
    const supabase = createSupabaseStub({
      signUpResult: {
        data: {
          user: { id: "account-2" },
          session: { access_token: "access-token" },
        },
        error: null,
      },
      rpcResult: {
        error: { message: "username_taken" },
      },
    });

    const result = await registerAccount(supabase as never, {
      email: "member@example.com",
      password: "password123",
      username: "Alice",
    });

    expect(result).toEqual({
      kind: "account_created_username_failed",
      accountId: "account-2",
      reason: "username_taken",
    });
  });
});
