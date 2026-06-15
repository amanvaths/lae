"use client";

import { Reveal } from "@/components/ui/Reveal";
import { LAE_COMMUNITY } from "@/lib/lae-content";

export function CommunityGrowth() {
  return (
    <section className="relative overflow-hidden border-y border-brand-500/10 bg-ink-900/50 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(255,195,26,0.08),transparent)]" />
      <div className="container-edge relative text-center">
        <Reveal>
          <h2 className="mx-auto max-w-3xl font-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            The community that{" "}
            <span className="text-shimmer">never stops growing</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {LAE_COMMUNITY.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
