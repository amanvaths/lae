"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LaeRegisterPanel } from "@/components/lae-club/LaeRegisterPanel";
import { withBasePath } from "@/lib/paths";
import { Shield, Zap, Lock } from "lucide-react";

export function RegisterPageContent() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <BrandLogo size={64} className="mx-auto" />
        <h1 className="mt-5 font-display text-2xl font-black text-white sm:text-[1.75rem]">
          Join The{" "}
          <span className="text-gradient-gold">LAE Club Network</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Activate your account and start building your 15-Level Smart Matrix.
        </p>
      </motion.div>

      <LaeRegisterPanel luxury />

      {/* Trust section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-6 flex items-center justify-center gap-5 border-t border-white/[0.06] pt-5"
      >
        {[
          { icon: Shield, text: "Secured" },
          { icon: Zap, text: "Instant" },
          { icon: Lock, text: "On-Chain" },
        ].map(({ icon: Icon, text }) => (
          <span key={text} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Icon className="h-3 w-3 text-[#D4AF37]/50" />
            {text}
          </span>
        ))}
      </motion.div>
    </>
  );
}
