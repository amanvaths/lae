"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LAE_DISTRIBUTION } from "@/lib/lae-content";

export function CommunityDistribution() {
  return (
    <section id="distribution" className="section-dark scroll-mt-28 py-20 sm:py-28">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Distribution"
          title={
            <>
              Community{" "}
              <span className="text-gradient-gold">distribution</span>
            </>
          }
          description={LAE_DISTRIBUTION.subtitle}
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {LAE_DISTRIBUTION.splits.map((s, i) => (
            <Reveal key={s.title} delay={i}>
              <motion.div
                whileHover={{ y: -4 }}
                className="relative overflow-hidden border border-brand-500/25 bg-ink-900/80 p-6 sm:p-8"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl" />
                <p className="font-display text-5xl font-bold text-brand-400 sm:text-6xl">
                  {s.pct}%
                </p>
                <h3 className="mt-3 font-display text-lg font-semibold uppercase tracking-wide text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={2}>
          <div className="mt-6 border border-white/10 bg-white/[0.02] px-5 py-4 text-center sm:px-8">
            <p className="text-sm text-slate-400">
              Per registration contribution:{" "}
              <strong className="font-mono text-brand-400">
                {LAE_DISTRIBUTION.registrationBtc} BTC
              </strong>{" "}
              → routed automatically by smart contract
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
