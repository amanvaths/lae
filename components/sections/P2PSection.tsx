"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, ExternalLink } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { withBasePath } from "@/lib/paths";

const features = [
  "Sell earned LAE rewards to other members",
  "Buy LAE directly from the community",
  "Internal P2P marketplace with escrow",
  "Also available on PancakeSwap",
];

export function P2PSection() {
  return (
    <section className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <SectionHeading
                align="left"
                eyebrow="P2P Exchange"
                title={
                  <>
                    Trade LAE{" "}
                    <span className="text-gradient-gold">peer-to-peer</span>
                  </>
                }
                description="An internal marketplace lets club members buy and sell earned LAE tokens directly — no external exchange required."
              />

              <ul className="mt-8 flex flex-col gap-3">
                {features.map((f, i) => (
                  <Reveal key={f} delay={i + 1} as="li">
                    <div className="flex items-start gap-3 text-sm text-slate-400">
                      <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                      {f}
                    </div>
                  </Reveal>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap gap-4">
                <motion.a
                  href={withBasePath("/p2p")}
                  className="btn-primary !px-6 !py-3 !text-sm"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Open P2P Market
                </motion.a>
                <motion.a
                  href="https://pancakeswap.finance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost !px-6 !py-3 !text-sm inline-flex items-center gap-2"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Trade on PancakeSwap
                  <ExternalLink className="h-3.5 w-3.5" />
                </motion.a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={2}>
            <div className="glass relative flex flex-col gap-6 p-8">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/[0.04] blur-3xl" />
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center border border-brand-500/30 bg-brand-500/10 text-brand-400">
                  <ArrowLeftRight className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-white">
                    P2P Marketplace
                  </p>
                  <p className="text-xs text-slate-500">
                    Member-to-member exchange
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MiniStat label="Sell" value="LAE Rewards" />
                <MiniStat label="Buy" value="From Members" />
                <MiniStat label="Escrow" value="Smart Contract" />
                <MiniStat label="External" value="PancakeSwap" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded border border-white/5 bg-white/[0.02] p-3">
      <span className="text-[0.6rem] uppercase tracking-wider text-slate-600">
        {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
