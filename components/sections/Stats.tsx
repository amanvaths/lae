"use client";

import { Counter } from "@/components/ui/Counter";
import { RevealGroup, Reveal } from "@/components/ui/Reveal";

const stats = [
  { label: "Total holders", value: 124800, suffix: "+", prefix: "" },
  { label: "Rewards distributed", value: 4.2, prefix: "$", suffix: "M", decimals: 1 },
  { label: "Active network nodes", value: 38500, suffix: "+", prefix: "" },
  { label: "Avg. APY on staking", value: 21.6, suffix: "%", decimals: 1, prefix: "" },
];

export function Stats() {
  return (
    <section className="relative py-12">
      <div className="container-edge">
        <RevealGroup className="glass grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/5 md:grid-cols-4">
          {stats.map((s) => (
            <Reveal key={s.label}>
              <div className="flex flex-col items-center gap-2 bg-ink-900/60 px-6 py-8 text-center">
                <span className="font-display text-3xl font-bold text-white sm:text-4xl">
                  <Counter
                    to={s.value}
                    prefix={s.prefix}
                    suffix={s.suffix}
                    decimals={s.decimals ?? 0}
                  />
                </span>
                <span className="text-sm text-slate-400">{s.label}</span>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
