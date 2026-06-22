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
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-[50vh] w-[50vw] bg-[radial-gradient(circle,rgba(212,175,55,0.06),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 h-[40vh] w-[40vw] bg-[radial-gradient(circle,rgba(192,192,192,0.04),transparent_70%)]" />
      </div>

      <div className="mx-auto flex min-h-[100dvh] min-h-[100svh] w-full max-w-6xl flex-col lg:flex-row">
        {/* Left — illustration */}
        <div className="flex flex-1 flex-col p-4 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:p-6 lg:p-8 lg:pt-10">
          <Link
            href={withBasePath("/")}
            className="mb-4 inline-flex items-center gap-2.5 self-start lg:mb-8"
          >
            <BrandLogo size={44} />
            <div>
              <span className="font-display text-lg font-bold text-white">LAE Club</span>
              <p className="text-[10px] uppercase tracking-widest text-[#C0C0C0]/70">
                Premium Matrix Network
              </p>
            </div>
          </Link>
          <AuthIllustration variant={variant} />
        </div>

        {/* Right — glass card */}
        <div className="flex flex-1 items-center justify-center p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-10">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="auth-glass w-full max-w-md p-6 sm:p-8"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
