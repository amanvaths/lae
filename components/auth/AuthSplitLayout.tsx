"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { AuthIllustration } from "./AuthIllustration";
import type { ReactNode } from "react";

export function AuthSplitLayout({
  variant,
  children,
}: {
  variant: "login" | "register";
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-[100dvh] min-h-[100svh] overflow-x-hidden bg-[#050505]">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[60vh] w-[50vw] bg-[radial-gradient(ellipse_at_20%_30%,rgba(212,175,55,0.07),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 h-[50vh] w-[40vw] bg-[radial-gradient(ellipse_at_80%_80%,rgba(192,192,192,0.04),transparent_60%)]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/[0.03] blur-[100px]" />
      </div>

      <div className="mx-auto flex min-h-[100dvh] min-h-[100svh] w-full max-w-[1280px] flex-col lg:flex-row">
        {/* Left — illustration */}
        <div className="flex flex-1 flex-col p-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:p-6 lg:p-8 lg:pt-8">
          <Link
            href={withBasePath("/")}
            className="mb-4 inline-flex items-center gap-3 self-start lg:mb-6"
          >
            <BrandLogo size={48} />
            <div>
              <span className="font-display text-xl font-black text-white">LAE Club</span>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37]/60">
                Premium Matrix Network
              </p>
            </div>
          </Link>
          <AuthIllustration variant={variant} />
        </div>

        {/* Right — glass card */}
        <div className="flex flex-1 items-center justify-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="auth-glass w-full max-w-[440px] p-6 sm:p-8"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
