"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { NetworkTree } from "@/components/charts/NetworkTree";
import { LAE_SMART_MATRIX } from "@/lib/lae-content";
import { getSlotTree, SLOT_TREE_META } from "@/lib/slot-trees";
import { cn } from "@/lib/utils";

export function SmartMatrix() {
  const [selected, setSelected] = useState(1);
  const meta = SLOT_TREE_META[selected];
  const tree = getSlotTree(selected);

  return (
    <section id="network" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="container-edge grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
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
        </Reveal>

        <Reveal delay={1}>
          <div className="glass relative mx-auto flex min-h-[420px] w-full max-w-md flex-col overflow-hidden lg:max-w-none">
            <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:28px_28px] opacity-30 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]" />

            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-1 flex-col p-4 sm:p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center border border-brand-500/30 bg-brand-500/10 text-brand-400">
                      <Layers className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold text-white">
                        Slot {selected} tree
                      </p>
                      <p className="text-xs text-slate-500">{meta.status}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p>
                      <span className="text-brand-400">{meta.members}</span>/14 members
                    </p>
                    <p>
                      <span className="text-emerald-400">{meta.cycles}</span> cycles
                    </p>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-x-auto">
                  <NetworkTree
                    data={tree}
                    height={380}
                    treeId={`slot-${selected}`}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[0.6rem]">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-3 w-4 rounded border border-[#C0C0C0]/50 bg-gradient-to-b from-[#E8E8E8]/30 to-[#A0A0A0]/15" />
                    <span className="text-slate-400">
                      <strong className="text-slate-200">Silver</strong> — Your Income
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-3 w-4 rounded border border-[#D4A017]/60 bg-gradient-to-b from-[#FFD700]/25 to-[#8B6914]/15" />
                    <span className="text-slate-400">
                      <strong className="text-amber-200">Gold</strong> — Flow & System
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
