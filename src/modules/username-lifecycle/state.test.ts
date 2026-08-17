import { describe, expect, it } from "vitest";

import { moderationStateForDecision } from "./state";

describe("moderation state mapping", () => {
  it.each([
    ["approve", "approved"],
    ["reject", "rejected"],
    ["human_review", "needs_human_review"],
    ["provider_error", "error"],
  ] as const)("maps %s to %s", (decision, state) => {
    expect(moderationStateForDecision(decision)).toBe(state);
  });
});
