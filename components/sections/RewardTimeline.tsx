"use client";

import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const months = Array.from({ length: 20 }, (_, i) => ({
  month: i + 1,
  release: 5,
  directs: i + 2,
}));

export function RewardTimeline() {
  return (
    <section id="rewards" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Reward Vesting"
          title={
            <>
              20-month{" "}
              <span className="text-gradient-gold">reward release</span>
            </>
          }
          description="LAE token rewards unlock 5% per month over 20 months. Each release requires direct referral qualification — missed months are locked, never burned."
        />

        {/* key info cards */}
        <Reveal>
          <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            <InfoCard label="Release per month" value="5%" />
            <InfoCard label="Total vesting" value="20 months" />
            <InfoCard label="Missed months" value="Locked, not burned" />
          </div>
        </Reveal>

        {/* timeline scroll */}
        <Reveal delay={1}>
          <div className="relative mt-14">
            <div className="scrollbar-hide -mx-4 overflow-x-auto px-4 pb-4">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {months.map((m, i) => (
                  <motion.div
                    key={m.month}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{
                      duration: 0.4,
                      delay: i * 0.03,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn(
                      "glass flex w-[120px] shrink-0 flex-col items-center gap-2 p-4",
                      m.month <= 3 && "border-brand-500/25 shadow-glow-gold"
                    )}
                  >
                    <span className="text-[0.6rem] uppercase tracking-wider text-slate-500">
                      Month
                    </span>
                    <span className="font-display text-xl font-bold text-white">
                      {m.month}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-brand-400">
                      {m.month <= 3 ? (
                        <Unlock className="h-3 w-3" />
                      ) : (
                        <Lock className="h-3 w-3 text-slate-500" />
                      )}
                      {m.release}%
                    </div>
                    <span className="text-[0.6rem] text-slate-500">
                      {m.directs} directs req.
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={2}>
          <p className="mt-8 text-center text-sm text-slate-500">
            <Lock className="mr-1.5 inline h-3.5 w-3.5 text-slate-600" />
            Missing qualification locks rewards for that month — they are{" "}
            <span className="text-white">never burned</span>, and can be
            unlocked later when qualification is met.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass flex flex-col items-center gap-1 p-5 text-center">
      <span className="font-display text-2xl font-bold text-brand-400">
        {value}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
