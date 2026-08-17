export type ResourceAccessMode = "authenticated" | "explicit";

export function canReadResource({
  authenticated,
  accessMode,
  hasExplicitGrant,
}: {
  authenticated: boolean;
  accessMode: ResourceAccessMode;
  hasExplicitGrant: boolean;
}): boolean {
  if (!authenticated) return false;
  return accessMode === "authenticated" || hasExplicitGrant;
}
