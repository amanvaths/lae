"use client";

import { motion } from "framer-motion";
import {
  Network,
  Lock,
  Zap,
  Globe2,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Network,
    title: "Network-to-earn",
    body: "Every connection you bring strengthens the protocol — and pays you in $LAE, automatically, on every level of your tree.",
    span: "md:col-span-2",
    glow: "from-brand-500/20",
  },
  {
    icon: Lock,
    title: "On-chain & transparent",
    body: "No hidden back-office. Every reward, rank and payout is a verifiable transaction.",
    span: "",
    glow: "from-accent-500/20",
  },
  {
    icon: Zap,
    title: "Instant settlement",
    body: "Rewards land in your wallet the moment they're earned — no 30-day waits.",
    span: "",
    glow: "from-gold-400/20",
  },
  {
    icon: Wallet,
    title: "Self-custody first",
    body: "Your keys, your tokens, your network. Connect any Web3 wallet and own it all.",
    span: "",
    glow: "from-emerald-500/20",
  },
  {
    icon: TrendingUp,
    title: "Deflationary by design",
    body: "A share of every transaction is burned, tightening supply as the network grows.",
    span: "md:col-span-2",
    glow: "from-brand-500/20",
  },
];

export function About() {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="Why $LAE"
          title={
            <>
              Networking, rebuilt for the{" "}
              <span className="text-gradient">on-chain era</span>
            </>
          }
          description="Traditional network plans hide the ledger and gate the payouts. LAE puts the entire economy on-chain — fair, instant and impossible to fake."
        />

        <RevealGroup className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((f) => (
            <Reveal key={f.title} className={cn(f.span)}>
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                className="group glass glass-hover relative h-full overflow-hidden p-6"
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
                    f.glow
                  )}
                />
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {f.body}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
