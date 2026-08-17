import { Clock3, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ModerationStatus } from "@/components/moderation-status";
import { ResourceTable } from "@/components/resource-table";
import { UsernameControls } from "@/components/username-controls";
import type {
  Profile,
  VisibleMember,
} from "@/lib/app-types";
import { resourceCatalog } from "@/lib/resource-catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "工作台",
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profilePromise = supabase
    .from("profiles")
    .select(
      "id,published_username,pending_username,moderation_state,moderation_revision,moderation_reason,moderation_updated_at",
    )
    .eq("id", user.id)
    .single<Profile>();
  const grantedResourcesPromise = supabase.from("resources").select("slug");
  const membersPromise = supabase
    .from("visible_members")
    .select("account_id,username,published_at")
    .order("published_at", { ascending: false })
    .limit(4)
    .returns<VisibleMember[]>();

  const [profileResult, grantedResult, membersResult] = await Promise.all([
    profilePromise,
    grantedResourcesPromise,
    membersPromise,
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  const profile = profileResult.data;
  const grantedSlugs = new Set(
    (grantedResult.data ?? []).map((resource) => resource.slug),
  );
  const members = membersResult.data ?? [];

  return (
    <main id="content" tabIndex={-1} className="page-shell py-8 sm:py-10">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold">账户概览</h1>
          <p className="mt-2 text-[#626a67]">
            查看用户名审核进度与资源访问权限。
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-[#626a67]">
          <Clock3 aria-hidden="true" className="size-4" />
          更新于 {formatDate(profile.moderation_updated_at)}
        </span>
      </div>

      {notice === "username-setup-failed" ? (
        <p
          className="mt-6 border-l-2 border-[#dc3f4c] bg-[#fff0f1] px-3 py-3 text-sm text-[#9f2430]"
          role="alert"
        >
          账户已创建，但用户名未能进入审核队列。请在下方重新提交用户名。
        </p>
      ) : null}

      <section className="mt-9 border-y border-[#dce1df]">
        <h2 className="sr-only">用户名审核</h2>
        <dl className="divide-y divide-[#eef1f0]">
          <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-medium text-[#626a67]">已发布用户名</dt>
            <dd className="font-semibold">
              {profile.published_username ?? "尚未发布"}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-medium text-[#626a67]">待审核用户名</dt>
            <dd className="font-semibold">
              {profile.pending_username ?? "当前没有待审核名称"}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-medium text-[#626a67]">审核状态</dt>
            <dd>
              {profile.pending_username || profile.published_username ? (
                <ModerationStatus state={profile.moderation_state} />
              ) : (
                <span className="text-sm font-semibold text-[#626a67]">
                  尚未提交用户名
                </span>
              )}
            </dd>
          </div>
          <div className="grid gap-1 py-4 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-medium text-[#626a67]">审核说明</dt>
            <dd className="text-sm leading-6 text-[#4e5753]">
              {profile.moderation_reason ??
                (profile.pending_username
                  ? "模型尚未返回审核结果。"
                  : "提交用户名后将自动加入后台审核队列。")}
            </dd>
          </div>
        </dl>
        <UsernameControls
          canRetry={profile.moderation_state === "error"}
          adminEmail={
            process.env.MODERATION_ADMIN_EMAIL ?? "admin@demo.henry070.org"
          }
        />
        <div className="h-5" />
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">资源访问状态</h2>
            <p className="mt-1 text-sm text-[#626a67]">
              资源 A 对登录用户开放，资源 B 需要显式授权。
            </p>
          </div>
        </div>
        <ResourceTable
          resources={resourceCatalog}
          grantedSlugs={grantedSlugs}
        />
      </section>

      <section className="mt-10 border-t border-[#dce1df] pt-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">成员目录预览</h2>
            <p className="mt-1 text-sm text-[#626a67]">
              只展示已经通过审核的已发布用户名。
            </p>
          </div>
          <Link
            href="/members"
            className="inline-flex min-h-10 items-center gap-2 rounded-[5px] px-3 text-sm font-semibold text-[#087f68] hover:bg-[#e7f5f0]"
          >
            <Users aria-hidden="true" className="size-4" />
            查看全部
          </Link>
        </div>
        {members.length ? (
          <ul className="mt-4 divide-y divide-[#eef1f0]" role="list">
            {members.map((member) => (
              <li
                key={member.account_id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="font-semibold">{member.username}</span>
                <span className="text-sm text-[#626a67]">
                  {formatDate(member.published_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 border-l-2 border-[#bbc4c0] bg-[#f7f8f8] px-3 py-3 text-sm text-[#626a67]">
            还没有审核通过的公开用户名。
          </p>
        )}
      </section>
    </main>
  );
}
