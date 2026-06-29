"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkTree } from "@/components/charts/NetworkTree";
import { LAE_SMART_MATRIX } from "@/lib/lae-content";
import { getSlotTree } from "@/lib/slot-trees";

export function SmartMatrix() {
  const tree = getSlotTree(1);

  return (
    <section id="network" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="container-edge space-y-10">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={LAE_SMART_MATRIX.eyebrow}
            title={
              <>
                <span className="text-gradient-silver">Silver</span> &{" "}
                <span className="text-gradient-gold">Gold</span> Matrix
              </>
            }
            description={LAE_SMART_MATRIX.body}
          />

          {/*
          <p className="mt-6 text-xs text-slate-500">
            Tap a slot to view its matrix tree
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: LAE_SMART_MATRIX.slots }, (_, i) => {
              const id = i + 1;
              const active = selected === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelected(id)}
                  className={cn(
                    "border px-2 py-3 text-center transition-all",
                    active
                      ? "border-brand-500 bg-brand-500/15 shadow-glow-gold"
                      : "border-white/10 bg-white/[0.03] hover:border-brand-500/30 hover:bg-brand-500/5"
                  )}
                >
                  <p className="text-[0.6rem] uppercase tracking-wider text-slate-500">
                    Slot
                  </p>
                  <p
                    className={cn(
                      "font-display text-lg font-bold",
                      active ? "text-brand-400" : "text-white"
                    )}
                  >
                    {id}
                  </p>
                </button>
              );
            })}
          </div>
          */}
        </Reveal>

        <Reveal delay={1}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative mx-auto w-full max-w-5xl overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:28px_28px] opacity-30 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]" />

            <div className="relative flex flex-col px-4 py-6 sm:px-8 sm:py-8">
              <div className="min-h-0 w-full overflow-x-auto">
                <NetworkTree data={tree} height={420} treeId="slot-1" />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/5 pt-5 text-[0.65rem] sm:text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-4 rounded border border-[#C0C0C0]/50 bg-gradient-to-b from-[#E8E8E8]/30 to-[#A0A0A0]/15" />
                  <span className="text-slate-400">
                    <strong className="text-slate-200">Silver</strong> — Your Income
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-4 rounded border border-[#D4A017]/60 bg-gradient-to-b from-[#FFD700]/25 to-[#8B6914]/15" />
                  <span className="text-slate-400">
                    <strong className="text-amber-200">Gold</strong> — Flow & System
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
