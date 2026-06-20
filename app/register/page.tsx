"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Suspense } from "react";
import { LaeRegisterPanel } from "@/components/lae-club/LaeRegisterPanel";
import { ViewUserIdPanel } from "@/components/lae-club/ViewUserIdPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";

export default function RegisterPage() {
  return (
    <main className="relative grid min-h-[100dvh] min-h-[100svh] place-items-center overflow-x-hidden px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(4.75rem+env(safe-area-inset-top))] sm:px-5 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[320px] w-[min(680px,100vw)] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[100px] sm:h-[460px] sm:blur-[130px]" />
      </div>

      <Link
        href={withBasePath("/")}
        className="absolute left-4 top-[calc(0.75rem+env(safe-area-inset-top))] flex items-center gap-2 sm:left-6 sm:top-6 sm:gap-2.5"
      >
        <BrandLogo size={40} className="sm:h-10 sm:w-10" />
        <span className="font-display text-lg font-bold text-white sm:text-xl">LAE</span>
      </Link>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-2 md:items-start">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-8">
          <div className="mb-5 text-center sm:mb-6">
            <UserPlus className="mx-auto h-9 w-9 text-brand-400 sm:h-10 sm:w-10" />
            <h1 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
              Register on-chain
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Complete registration before accessing the dashboard.
            </p>
          </div>

          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <LaeRegisterPanel />
          </Suspense>

          <p className="mt-5 text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link href={withBasePath("/login")} className="text-brand-300 hover:text-brand-200">
              Login with wallet
            </Link>
          </p>
        </div>

        <ViewUserIdPanel />
      </div>
    </main>
  );
}
