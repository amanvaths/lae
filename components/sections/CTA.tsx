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
    <section id="cta" className="relative py-24 sm:py-32">
      <div className="container-edge">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[2rem] p-1">
            {/* animated conic glow ring */}
            <div className="pointer-events-none absolute inset-0 opacity-40">
              <div className="ring-conic absolute -inset-1/2 animate-spin-slow" />
            </div>

            <div className="relative grid items-center gap-8 rounded-[1.9rem] bg-ink-900/80 p-8 backdrop-blur-2xl sm:p-12 lg:grid-cols-2">
              <div className="flex flex-col items-start gap-6">
                <span className="chip">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Join 124,800+ holders
                </span>
                <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                  Build your network.
                  <br />
                  <span className="text-gradient">Own the upside.</span>
                </h2>
                <p className="max-w-md text-slate-400">
                  Connect your wallet, grab your referral link and start earning
                  $LAE on every level of the network you grow.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <a href="#" className="btn-primary">
                    Buy $LAE now <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={withBasePath("/whitepaper")} className="btn-ghost">
                    Read whitepaper
                  </a>
                </div>

                <button
                  onClick={copy}
                  className="mt-1 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-mono text-sm text-slate-300 transition-colors hover:border-white/20"
                >
                  <span className="text-slate-500">Contract:</span>
                  {address}
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Spline / 3D visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto aspect-square w-full max-w-[420px]"
              >
                <CoinFallback spin={false} />
              </motion.div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
