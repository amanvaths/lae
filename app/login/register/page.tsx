"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { RegisterGate } from "@/components/auth/RegisterGate";
import { RegisterPanel } from "@/components/onchain/RegisterPanel";
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

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur sm:p-8">
        <div className="mb-5 text-center sm:mb-6">
          <UserPlus className="mx-auto h-9 w-9 text-brand-400 sm:h-10 sm:w-10" />
          <h1 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
            Register on-chain
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
            Complete registration before accessing the dashboard.
          </p>
        </div>

        <RegisterGate>
          <RegisterPanel />
        </RegisterGate>

        <p className="mt-5 text-center text-xs text-slate-500">
          <Link href={withBasePath("/login")} className="text-brand-300 hover:text-brand-200">
            Back to connect wallet
          </Link>
        </p>
      </div>
    </main>
  );
}
