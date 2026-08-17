import { describe, expect, it } from "vitest";

import { canReadResource } from "./policy";

describe("resource access policy", () => {
  it.each([
    {
      authenticated: false,
      accessMode: "authenticated" as const,
      hasExplicitGrant: false,
      expected: false,
    },
    {
      authenticated: true,
      accessMode: "authenticated" as const,
      hasExplicitGrant: false,
      expected: true,
    },
    {
      authenticated: true,
      accessMode: "explicit" as const,
      hasExplicitGrant: false,
      expected: false,
    },
    {
      authenticated: true,
      accessMode: "explicit" as const,
      hasExplicitGrant: true,
      expected: true,
    },
  ])(
    "returns $expected for $accessMode access",
    ({ expected, ...input }) => {
      expect(canReadResource(input)).toBe(expected);
    },
  );
});
