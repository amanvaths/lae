"use client";

import { motion } from "framer-motion";

const partners = [
  { name: "Ethereum", abbr: "ETH", color: "#627EEA" },
  { name: "BNB Chain", abbr: "BNB", color: "#F3BA2F" },
  { name: "Polygon", abbr: "MATIC", color: "#8247E5" },
  { name: "Arbitrum", abbr: "ARB", color: "#28A0F0" },
  { name: "CertiK", abbr: "CK", color: "#E5453D" },
  { name: "Chainlink", abbr: "LINK", color: "#375BD2" },
];

function PartnerBadge({ name, abbr, color }: (typeof partners)[0]) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-sm border border-white/10 bg-ink-900/80 px-5 py-3 backdrop-blur-sm transition-colors hover:border-brand-500/30">
      <div
        className="grid h-9 w-9 place-items-center rounded-full text-[0.65rem] font-bold text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}
      >
        {abbr.slice(0, 2)}
      </div>
      <span className="whitespace-nowrap text-sm font-medium text-slate-300">{name}</span>
    </div>
  );
}

export function PartnersStrip() {
  const row = [...partners, ...partners];

  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-ink-900/50 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_100%_at_50%_50%,rgba(255,195,26,0.06),transparent)]" />
      <div className="container-edge mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          Built on trusted infrastructure
        </p>
      </div>
      <div className="relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 pr-4"
        >
          {row.map((p, i) => (
            <PartnerBadge key={`${p.name}-${i}`} {...p} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
