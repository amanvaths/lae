"use client";

import { Reveal } from "@/components/ui/Reveal";
import { CoinFallback } from "@/components/three/CoinFallback";
import { LAE_VISION } from "@/lib/lae-content";

export function Vision() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-ink-950 py-16 sm:py-24">
      <div className="container-edge grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <div className="flex flex-col gap-5">
            <span className="section-label">{LAE_VISION.eyebrow}</span>
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              {LAE_VISION.eyebrow}{" "}
              <span className="text-shimmer">{LAE_VISION.title}</span>
            </h2>
            <p className="text-lg font-medium text-slate-300">{LAE_VISION.subtitle}</p>
            {LAE_VISION.body.map((p) => (
              <p key={p.slice(0, 32)} className="leading-relaxed text-slate-400">
                {p}
              </p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-3xl" />
            <CoinFallback spin={false} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
