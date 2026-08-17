import type { User } from "@supabase/supabase-js";

import type { ResourceDocument } from "@/lib/app-types";
import { resourceCatalog } from "@/lib/resource-catalog";
import { createClient } from "@/lib/supabase/server";

export type ResourceReadResult =
  | { kind: "granted"; resource: ResourceDocument }
  | { kind: "unauthenticated" }
  | { kind: "forbidden" }
  | { kind: "not_found" };

export async function readResource(
  user: User | null,
  resourceSlug: string,
): Promise<ResourceReadResult> {
  if (!user) return { kind: "unauthenticated" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("slug", resourceSlug)
    .maybeSingle<ResourceDocument>();

  if (data) return { kind: "granted", resource: data };

  return resourceCatalog.some((resource) => resource.slug === resourceSlug)
    ? { kind: "forbidden" }
    : { kind: "not_found" };
}
