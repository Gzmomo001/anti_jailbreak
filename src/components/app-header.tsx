import {
  BookOpenText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";

const navigation = [
  { href: "/dashboard", label: "工作台", icon: LayoutDashboard },
  { href: "/members", label: "成员", icon: Users },
  { href: "/resources/a", label: "资源 A", icon: BookOpenText },
  { href: "/resources/b", label: "资源 B", icon: ShieldCheck },
];

export function AppHeader({
  username,
  email,
}: {
  username: string | null;
  email: string;
}) {
  return (
    <header className="border-b border-[#dce1df] bg-white">
      <a className="skip-link" href="#content">
        跳至主要内容
      </a>
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-7">
          <Link href="/dashboard" aria-label="Gatehouse 工作台">
            <BrandMark />
          </Link>
          <nav aria-label="主要导航" className="hidden md:block">
            <ul className="flex items-center gap-1" role="list">
              {navigation.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="inline-flex min-h-10 items-center gap-2 rounded-[5px] px-3 text-sm font-medium text-[#4e5753] hover:bg-[#f2f4f3] hover:text-[#151817]"
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-semibold">
              {username ?? "等待用户名审核"}
            </p>
            <p className="truncate text-xs text-[#626a67]">{email}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="grid size-10 place-items-center rounded-[5px] border border-[#dce1df] text-[#626a67] hover:border-[#bbc4c0] hover:bg-[#f7f8f8] hover:text-[#dc3f4c]"
              title="退出登录"
              aria-label="退出登录"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          </form>
        </div>
      </div>

      <nav
        aria-label="移动导航"
        className="overflow-x-auto border-t border-[#eef1f0] md:hidden"
      >
        <ul className="page-shell flex min-w-max items-center gap-1 py-1" role="list">
          {navigation.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-flex min-h-10 items-center gap-2 rounded-[5px] px-3 text-sm font-medium text-[#4e5753] hover:bg-[#f2f4f3]"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
