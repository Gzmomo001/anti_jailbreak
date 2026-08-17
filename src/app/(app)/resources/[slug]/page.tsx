import {
  ArrowLeft,
  CalendarDays,
  FileText,
  LockKeyhole,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { readResource } from "@/modules/resource-access/read";

export const dynamic = "force-dynamic";

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const result = await readResource(user, slug);

  if (result.kind === "unauthenticated") redirect("/login");
  if (result.kind === "not_found") notFound();

  if (result.kind === "forbidden") {
    return (
      <main
        id="content"
        tabIndex={-1}
        className="page-shell grid min-h-[70dvh] place-items-center py-12"
      >
        <section className="w-full max-w-xl border-y border-[#dce1df] py-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-[6px] bg-[#fff0f1] text-[#dc3f4c]">
            <ShieldAlert aria-hidden="true" className="size-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">403 · 无权访问资源 B</h1>
          <p className="mx-auto mt-3 max-w-md leading-7 text-[#626a67]">
            该资源采用默认拒绝策略。只有存在显式授权记录的测试账号可以读取。
          </p>
          <Link href="/dashboard" className="secondary-button mt-6">
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回工作台
          </Link>
        </section>
      </main>
    );
  }

  const { resource } = result;

  return (
    <main id="content" tabIndex={-1} className="page-shell py-8 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex min-h-10 items-center gap-2 rounded-[5px] px-2 text-sm font-semibold text-[#087f68] hover:bg-[#e7f5f0]"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        返回工作台
      </Link>

      <article className="mt-5">
        <header className="border-b border-[#dce1df] pb-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-[6px] border border-[#dce1df] bg-[#f7f8f8]">
              {resource.access_mode === "explicit" ? (
                <LockKeyhole
                  aria-hidden="true"
                  className="size-6 text-[#dc3f4c]"
                />
              ) : (
                <FileText
                  aria-hidden="true"
                  className="size-6 text-[#087f68]"
                />
              )}
            </span>
            <div>
              <h1 className="text-3xl font-bold">{resource.title}</h1>
              <p className="mt-2 max-w-2xl leading-7 text-[#626a67]">
                {resource.summary}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#626a67]">
            <span>版本 {resource.version}</span>
            <span>{resource.document_size}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" className="size-4" />
              {new Intl.DateTimeFormat("zh-CN", {
                dateStyle: "long",
                timeZone: "Asia/Shanghai",
              }).format(new Date(resource.updated_at))}
            </span>
          </div>
        </header>

        <div className="max-w-3xl py-8">
          <h2 className="text-xl font-bold">文档内容</h2>
          <p className="mt-4 text-base leading-8 text-[#3e4643]">
            {resource.content}
          </p>
        </div>
      </article>
    </main>
  );
}
