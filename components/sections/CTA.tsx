"use client";

import { motion } from "framer-motion";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { withBasePath } from "@/lib/paths";
import { CoinFallback } from "@/components/three/CoinFallback";

export function CTA() {
  const [copied, setCopied] = useState(false);
  const address = "0xLAE7…9f3A";

  const copy = () => {
    navigator.clipboard?.writeText("0xLAE700000000000000000000000000000009f3A");
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="cta" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(255,195,26,0.08),transparent)]" />
      <div className="container-edge relative">
        <Reveal>
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="relative overflow-hidden rounded-sm border border-brand-500/25 p-px shadow-glow-gold"
          >
            <div className="pointer-events-none absolute inset-0 opacity-30">
              <div className="ring-conic absolute -inset-full animate-spin-slow" />
            </div>

            <div className="relative grid items-center gap-8 bg-ink-900/95 p-8 backdrop-blur-xl sm:p-12 lg:grid-cols-2">
              <div className="flex flex-col items-start gap-6">
                <span className="chip">
                  <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
                  Join 124,800+ holders
                </span>
                <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                  Build your network.
                  <br />
                  <span className="text-shimmer">Own the upside.</span>
                </h2>
                <p className="max-w-md text-slate-400">
                  Connect your wallet, grab your referral link and start earning
                  $LAE on every level of the network you grow.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a href="#cta" className="btn-primary group">
                    Buy $LAE now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a href={withBasePath("/whitepaper")} className="btn-ghost">
                    Read whitepaper
                  </a>
                </div>

                <motion.button
                  onClick={copy}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3 border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-sm text-slate-300 transition-colors hover:border-brand-500/30"
                >
                  <span className="text-slate-500">Contract:</span>
                  {address}
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: -8 }}
                whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto aspect-square w-full max-w-[420px] [perspective:800px]"
              >
                <div className="absolute inset-0 animate-pulse-glow rounded-full bg-brand-500/10 blur-3xl" />
                <CoinFallback spin={false} />
              </motion.div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
