"use client";

import { Counter } from "@/components/ui/Counter";
import { RevealGroup, Reveal } from "@/components/ui/Reveal";

const stats = [
  { label: "Token\nHolders", value: 124800, suffix: "+", prefix: "" },
  { label: "Rewards\nDistributed", value: 4, prefix: "$", suffix: "M", decimals: 0 },
  { label: "Active Network\nNodes", value: 38500, suffix: "+", prefix: "" },
  { label: "Avg. APY\nStaking", value: 21, suffix: "%", decimals: 0, prefix: "" },
];

export function Stats() {
  return (
    <section className="relative bg-cryptro-stats py-20 sm:py-28" aria-label="Key metrics">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,195,26,0.12),transparent)]" />
      <div className="container-edge relative">
        <Reveal className="mb-12 text-center">
          <span className="section-label">Interesting Stats</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Growing <span className="text-shimmer">Global Network</span>
          </h2>
        </Reveal>

        <RevealGroup className="grid grid-cols-2 divide-white/5 md:grid-cols-4 md:divide-x">
          {stats.map((s) => (
            <Reveal key={s.label}>
              <div className="group flex flex-col items-center gap-3 px-4 py-6 text-center transition-transform duration-300 hover:scale-105">
                <span className="font-display text-4xl font-bold text-brand-400 drop-shadow-[0_0_24px_rgba(255,195,26,0.35)] sm:text-5xl">
                  <Counter
                    to={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    decimals={s.decimals ?? 0}
                  />
                </span>
                <span className="whitespace-pre-line text-sm text-slate-500 transition-colors group-hover:text-slate-400">
                  {s.label}
                </span>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
