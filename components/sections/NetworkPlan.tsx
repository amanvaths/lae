"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkTree } from "@/components/charts/NetworkTree";
import { GrowthChart } from "@/components/charts/GrowthChart";

const levels = [
  { level: "Level 1 — Direct", rate: "12%", note: "People you onboard directly" },
  { level: "Level 2", rate: "8%", note: "Your network's network" },
  { level: "Level 3", rate: "5%", note: "Third-degree connections" },
  { level: "Level 4+", rate: "3%", note: "Depth bonus, up to 7 levels" },
];

export function NetworkPlan() {
  return (
    <section id="network" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          align="left"
          eyebrow="The network plan"
          title={
            <>
              Earn on every level of{" "}
              <span className="text-gradient-gold">your tree</span>
            </>
          }
          description="$LAE rewards flow up through your entire network — transparently, on every transaction your downline makes. The deeper and wider you build, the more you earn."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Tree viz */}
          <Reveal>
            <div className="glass relative overflow-hidden p-6">
              <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:32px_32px] opacity-40 [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />
              <div className="relative">
                <p className="mb-1 text-sm font-semibold text-white">
                  Live reward distribution
                </p>
                <p className="mb-4 text-xs text-slate-400">
                  Watch value propagate up the network
                </p>
                <NetworkTree />
              </div>
            </div>
          </Reveal>

          {/* Level rewards */}
          <div className="flex flex-col gap-3">
            {levels.map((l, i) => (
              <Reveal key={l.level} delay={i}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className="group relative flex items-center justify-between overflow-hidden rounded-sm border border-white/10 bg-gradient-to-r from-white/[0.04] to-transparent px-5 py-4 transition-colors hover:border-brand-500/20"
                >
                  <span className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-gold-400 to-brand-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div>
                    <p className="text-sm font-semibold text-white">{l.level}</p>
                    <p className="text-xs text-slate-400">{l.note}</p>
                  </div>
                  <span className="font-display text-2xl font-bold text-brand-400">
                    {l.rate}
                  </span>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Growth chart */}
        <Reveal delay={1}>
          <div className="glass mt-6 p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-lg font-semibold text-white">
                  Network growth
                </p>
                <p className="text-sm text-slate-400">
                  Cumulative active nodes (in thousands)
                </p>
              </div>
              <span className="chip">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                +212% YoY
              </span>
            </div>
            <GrowthChart />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
