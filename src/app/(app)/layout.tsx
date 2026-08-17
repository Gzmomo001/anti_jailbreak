import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import type { Profile } from "@/lib/app-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,published_username,pending_username,moderation_state,moderation_revision,moderation_reason,moderation_updated_at",
    )
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <>
      <AppHeader
        username={profile?.published_username ?? null}
        email={user.email ?? "已登录用户"}
      />
      {children}
    </>
  );
}
