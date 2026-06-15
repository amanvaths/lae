import type { Metadata } from "next";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CountdownTimer } from "@/components/coming-soon/CountdownTimer";
import { withBasePath } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Coming Soon — LAE Protocol",
  description: "LAE Protocol launches 22 June 2026. The decentralized network token is almost here.",
};

export default function ComingSoonPage() {
  return (
    <main className="relative flex min-h-[100vh] min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-ink-950 px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,195,26,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-brand-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-1/4 h-72 w-72 rounded-full bg-brand-500/8 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:40px_40px] opacity-[0.04]" />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div className="mb-8 animate-float">
          <BrandLogo size={88} className="md:hidden" />
          <BrandLogo size={112} className="hidden md:block" />
        </div>

        <span className="section-label mb-5">Launching soon</span>

        <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
          Something big is{" "}
          <span className="text-shimmer">coming</span>
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
          <strong className="font-semibold text-slate-200">$LAE</strong> — the
          decentralized network token. Transparent rewards, on-chain growth, fully
          yours. Mark your calendar.
        </p>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-brand-400">
          22 June 2026
        </p>

        <div className="mt-6 w-full max-w-xl">
          <CountdownTimer />
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:support@lae.finance"
            className="btn-ghost !px-5 !py-2.5 !text-xs"
          >
            Get notified
          </a>
          <a href={withBasePath("/")} className="btn-primary !px-5 !py-2.5 !text-xs">
            Preview site
          </a>
        </div>
      </div>

      <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} LAE Protocol
      </p>
    </main>
  );
}
