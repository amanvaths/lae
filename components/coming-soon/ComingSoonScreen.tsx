"use client";

import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CountdownTimer } from "@/components/coming-soon/CountdownTimer";
import { PreviewSiteButton } from "@/components/coming-soon/PreviewSiteButton";

export function ComingSoonScreen() {
  return (
    <main className="relative flex min-h-[100dvh] min-h-[100svh] flex-col items-center justify-center overflow-x-hidden bg-ink-950 px-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] min-[380px]:px-4 sm:px-6 sm:pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,195,26,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-48 w-48 rounded-full bg-brand-500/10 blur-[80px] sm:-left-32 sm:h-64 sm:w-64 sm:blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-1/4 h-56 w-56 rounded-full bg-brand-500/8 blur-[90px] sm:-right-32 sm:h-72 sm:w-72 sm:blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:32px_32px] opacity-[0.04] sm:bg-[size:40px_40px]" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="mb-4 animate-float min-[380px]:mb-5 sm:mb-8">
          <BrandLogo size={64} className="min-[380px]:hidden" />
          <BrandLogo size={72} className="hidden min-[380px]:block sm:hidden" />
          <BrandLogo size={96} className="hidden sm:block md:hidden" />
          <BrandLogo size={112} className="hidden md:block" />
        </div>

        <span className="section-label mb-4 sm:mb-5">Launching soon</span>

        <h1 className="font-display text-[1.75rem] font-bold leading-[1.12] text-white min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
          Something big is{" "}
          <span className="text-shimmer">coming</span>
        </h1>

        <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:mt-5 sm:max-w-lg sm:text-base md:text-lg">
          <strong className="font-semibold text-slate-200">$LAE</strong> — the
          decentralized network token on BNB Chain. Transparent rewards, on-chain
          growth, fully yours.
        </p>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-400 sm:mt-8 sm:text-sm sm:tracking-[0.25em]">
          22 June 2026
        </p>

        <div className="mt-5 w-full max-w-xl px-1 sm:mt-6">
          <CountdownTimer />
        </div>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
          <a
            href="mailto:support@lae.finance"
            className="btn-ghost w-full justify-center !px-5 !py-3 !text-xs sm:w-auto sm:!py-2.5"
          >
            Get notified
          </a>
          <PreviewSiteButton />
        </div>

        <p className="mt-6 max-w-xs text-[0.65rem] leading-relaxed text-slate-600 sm:max-w-sm sm:text-xs">
          Tap preview once to explore the full site. You won&apos;t be redirected
          back here until launch day.
        </p>
      </div>

      <p className="absolute bottom-4 left-0 right-0 px-4 text-center text-[0.65rem] text-slate-600 sm:bottom-6 sm:text-xs">
        © {new Date().getFullYear()} LAE Protocol · laeclub.org
      </p>
    </main>
  );
}
