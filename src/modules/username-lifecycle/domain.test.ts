import { describe, expect, it } from "vitest";

import {
  normalizeUsername,
  parseUsername,
  USERNAME_PATTERN,
} from "./domain";

describe("username rules", () => {
  it.each(["张伟", "Alice", "user_01", "社区-成员", "Ａlice"])(
    "accepts %s",
    (username) => {
      expect(parseUsername(username)).toBeTruthy();
    },
  );

  it.each(["a", "x".repeat(21), "name with space", "<script>", "user.name"])(
    "rejects %s",
    (username) => {
      expect(() => parseUsername(username)).toThrow();
    },
  );

  it("normalizes Unicode width, case, and surrounding whitespace", () => {
    expect(normalizeUsername("  ＡLICE_01  ")).toBe("alice_01");
  });

  it("keeps the database-compatible pattern in sync", () => {
    expect(USERNAME_PATTERN.test("社区-user_01")).toBe(true);
    expect(USERNAME_PATTERN.test("community user")).toBe(false);
  });
});
