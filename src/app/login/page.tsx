import Image from "next/image";

import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand-mark";

export const metadata = {
  title: "登录",
};

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-white">
      <header className="page-shell flex min-h-16 items-center">
        <BrandMark />
      </header>

      <div className="relative min-h-[calc(100dvh-4rem)] border-t border-[#dce1df]">
        <div className="absolute inset-x-0 top-0 h-[45%] min-h-64 overflow-hidden sm:h-[52%]">
          <Image
            src="/auth-gate.png"
            alt="一座开放入口的现代建筑"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="page-shell relative flex min-h-[calc(100dvh-4rem)] items-start justify-center pb-12 pt-40 sm:items-center sm:py-16">
          <section className="w-full max-w-[480px] border border-[#dce1df] bg-white p-6 shadow-[0_18px_60px_rgba(20,28,25,0.12)] sm:p-9">
            <AuthForm />
          </section>
        </div>
      </div>
    </main>
  );
}
