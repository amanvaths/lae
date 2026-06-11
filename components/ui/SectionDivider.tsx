"use client";

import { motion } from "framer-motion";

export function SectionDivider() {
  return (
    <div className="container-edge py-2" aria-hidden>
      <div className="relative flex items-center justify-center">
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="h-px w-full max-w-3xl origin-center bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"
        />
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          whileInView={{ scale: 1, rotate: 45 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          className="absolute h-2.5 w-2.5 border border-brand-500/60 bg-brand-500/20 shadow-[0_0_12px_rgba(255,195,26,0.5)]"
        />
      </div>
    </div>
  );
}
