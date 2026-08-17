import { Users } from "lucide-react";

import type { VisibleMember } from "@/lib/app-types";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "成员",
};

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("visible_members")
    .select("account_id,username,published_at")
    .order("published_at", { ascending: false })
    .returns<VisibleMember[]>();
  const members = data ?? [];

  return (
    <main id="content" tabIndex={-1} className="page-shell py-8 sm:py-10">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[6px] bg-[#e7f5f0] text-[#087f68]">
          <Users aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="text-3xl font-bold">成员目录</h1>
          <p className="mt-1 text-[#626a67]">
            共 {members.length} 个公开用户名
          </p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto border-t border-[#dce1df]">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">已经通过用户名审核的成员</caption>
          <thead>
            <tr className="border-b border-[#dce1df] text-xs uppercase text-[#626a67]">
              <th className="px-3 py-3 font-semibold" scope="col">
                用户名
              </th>
              <th className="px-3 py-3 font-semibold" scope="col">
                发布时间
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.account_id} className="border-b border-[#eef1f0]">
                <td className="px-3 py-4 font-semibold">{member.username}</td>
                <td className="px-3 py-4 text-sm text-[#626a67]">
                  {new Intl.DateTimeFormat("zh-CN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Shanghai",
                  }).format(new Date(member.published_at))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!members.length ? (
          <p className="py-10 text-center text-[#626a67]">
            暂无审核通过的成员。
          </p>
        ) : null}
      </div>
    </main>
  );
}
