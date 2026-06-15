"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { CoinFallback } from "@/components/three/CoinFallback";
import { LAE_TOKENOMICS, LAE_DISTRIBUTION, fmtLae } from "@/lib/lae-content";
import { RewardFlowGraphic } from "@/components/ui/RewardFlowGraphic";

const points = [
  "15-slot smart matrix — auto progression",
  "90% community reward allocation",
  "0.001 BTC contribution per registration",
  "Self-custody — connect any Web3 wallet",
  "Transparent smart-contract distribution",
  "BNB Chain only — BEP-20 token",
];

export function AboutLae() {
  return (
    <section id="about" className="section-dark scroll-mt-24 py-20 sm:py-28">
      <div className="container-edge grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative mx-auto aspect-square w-full max-w-md">
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-brand-500/10 blur-2xl"
            />
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-brand-500/25" />
            <div
              className="absolute inset-4 rounded-full border border-dashed border-brand-500/20"
              style={{ animation: "orbit 25s linear infinite reverse" }}
            />
            <CoinFallback spin={false} />
            <div className="absolute -left-4 top-0 w-[45%] opacity-90 sm:-left-8">
              <RewardFlowGraphic />
            </div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-2 bottom-8 border border-brand-500/30 bg-ink-950 px-4 py-3 text-center shadow-glow-gold"
            >
              <p className="font-display text-2xl font-bold text-brand-400">
                {fmtLae(LAE_TOKENOMICS.totalSupply)}
              </p>
              <p className="text-[0.65rem] uppercase tracking-wider text-slate-500">
                Total Supply
              </p>
            </motion.div>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="flex flex-col gap-5">
            <span className="section-label">About</span>
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
              What is <span className="text-shimmer">$LAE?</span>
            </h2>
            <p className="leading-relaxed text-slate-400">
              <strong className="text-slate-200">$LAE</strong> powers the LAE Club
              ecosystem on BNB Chain — a transparent, community-driven reward economy
              with {fmtLae(LAE_TOKENOMICS.communityReward.amount)} LAE (
              {LAE_TOKENOMICS.communityReward.pct}%) allocated to participants.
            </p>
            <p className="leading-relaxed text-slate-400">
              Launch price {LAE_TOKENOMICS.launchPriceLabel} with a long-term ecosystem
              target of {LAE_TOKENOMICS.ecosystemTarget}. Every registration contributes{" "}
              {LAE_DISTRIBUTION.registrationBtc} BTC routed by smart contract.
            </p>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {points.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                  className="flex items-start gap-2 text-sm text-slate-400"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  {p}
                </motion.li>
              ))}
            </ul>
            <motion.a
              href="#cta"
              whileHover={{ scale: 1.03, x: 4 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary mt-2 w-fit"
            >
              Get $LAE
            </motion.a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
