import { describe, expect, it } from "vitest";

import { parseModerationDecision } from "./parse";

describe("parseModerationDecision", () => {
  it.each(["approve", "reject", "human_review"] as const)(
    "parses %s",
    (decision) => {
      expect(
        parseModerationDecision(
          JSON.stringify({ decision, reason: "测试原因" }),
        ),
      ).toEqual({ decision, reason: "测试原因" });
    },
  );

  it("extracts JSON from a fenced response", () => {
    expect(
      parseModerationDecision(
        '```json\n{"decision":"approve","reason":"正常用户名"}\n```',
      ),
    ).toEqual({ decision: "approve", reason: "正常用户名" });
  });

  it.each([
    "",
    "not json",
    '{"decision":"unknown","reason":"x"}',
    '{"decision":"approve"}',
    '{"decision":"approve","reason":""}',
  ])("rejects malformed output: %s", (output) => {
    expect(() => parseModerationDecision(output)).toThrow();
  });
});
