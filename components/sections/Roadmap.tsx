"use client";

import { motion } from "framer-motion";
import { Check, Loader, Circle } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const phases = [
  {
    q: "Q1 2025",
    title: "Genesis",
    status: "done",
    items: ["Smart-contract audit", "Token generation event", "Founding network of 5K"],
  },
  {
    q: "Q2 2025",
    title: "Network launch",
    status: "done",
    items: ["On-chain referral engine", "Multi-level reward routing", "Wallet integrations"],
  },
  {
    q: "Q3 2025",
    title: "Scale",
    status: "active",
    items: ["Staking vaults & APY", "Mobile dApp", "Cross-chain bridge (BNB, Polygon)"],
  },
  {
    q: "Q4 2025",
    title: "Decentralize",
    status: "next",
    items: ["LAE DAO governance", "Community treasury votes", "Rank-based NFT badges"],
  },
  {
    q: "2026",
    title: "Ecosystem",
    status: "next",
    items: ["Merchant payments", "Real-world utility partners", "Global ambassador program"],
  },
];

const statusMap = {
  done: { icon: Check, ring: "border-emerald-400 bg-emerald-400/15 text-emerald-400" },
  active: { icon: Loader, ring: "border-brand-400 bg-brand-400/15 text-brand-300" },
  next: { icon: Circle, ring: "border-white/15 bg-white/5 text-slate-500" },
} as const;

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Roadmap"
          title={
            <>
              The path from token to{" "}
              <span className="text-gradient">global network</span>
            </>
          }
          description="A deliberate rollout — security first, then scale, then full community ownership."
        />

        <div className="relative mt-16">
          {/* vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-400/60 via-brand-400/40 to-white/5 md:left-1/2 md:-translate-x-1/2" />

          <div className="flex flex-col gap-8">
            {phases.map((p, i) => {
              const S = statusMap[p.status as keyof typeof statusMap];
              const left = i % 2 === 0;
              return (
                <Reveal key={p.q} delay={i}>
                  <div
                    className={cn(
                      "relative flex items-start gap-6 md:w-1/2",
                      left ? "md:pr-12" : "md:ml-auto md:flex-row-reverse md:pl-12"
                    )}
                  >
                    {/* marker */}
                    <div
                      className={cn(
                        "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 backdrop-blur-md md:absolute md:top-1",
                        S.ring,
                        left ? "md:-right-5" : "md:-left-5"
                      )}
                    >
                      <S.icon
                        className={cn("h-4 w-4", p.status === "active" && "animate-spin-slow")}
                      />
                    </div>

                    <motion.div
                      whileHover={{ y: -4 }}
                      className="glass glass-hover flex-1 p-6"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-300">
                          {p.q}
                        </span>
                        {p.status === "active" && (
                          <span className="chip !py-0.5 text-[10px]">In progress</span>
                        )}
                      </div>
                      <h3 className="mb-3 font-display text-xl font-bold text-white">
                        {p.title}
                      </h3>
                      <ul className="flex flex-col gap-1.5">
                        {p.items.map((it) => (
                          <li
                            key={it}
                            className="flex items-center gap-2 text-sm text-slate-400"
                          >
                            <span className="h-1 w-1 rounded-full bg-brand-400" />
                            {it}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
