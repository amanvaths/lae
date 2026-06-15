"use client";

import { Layers } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { LAE_SMART_MATRIX } from "@/lib/lae-content";

export function SmartMatrix() {
  return (
    <section id="network" className="relative scroll-mt-28 py-20 sm:py-28">
      <div className="container-edge grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <SectionHeading
            align="left"
            eyebrow={LAE_SMART_MATRIX.eyebrow}
            title={
              <>
                15 slot smart{" "}
                <span className="text-gradient-gold">matrix</span>
              </>
            }
            description={LAE_SMART_MATRIX.body}
          />

          <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: LAE_SMART_MATRIX.slots }, (_, i) => (
              <div
                key={i}
                className="border border-white/10 bg-white/[0.03] px-2 py-3 text-center transition-colors hover:border-brand-500/30 hover:bg-brand-500/5"
              >
                <p className="text-[0.6rem] uppercase tracking-wider text-slate-500">
                  Slot
                </p>
                <p className="font-display text-lg font-bold text-white">{i + 1}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div className="glass relative flex aspect-square max-w-md flex-col items-center justify-center gap-4 p-8 mx-auto lg:max-w-none">
            <div className="pointer-events-none absolute inset-0 bg-grid-lines bg-[size:28px_28px] opacity-30 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]" />
            <span className="relative grid h-20 w-20 place-items-center border border-brand-500/30 bg-brand-500/10 text-brand-400">
              <Layers className="h-10 w-10" />
            </span>
            <p className="relative text-center font-display text-2xl font-bold text-white">
              {LAE_SMART_MATRIX.slots} Slots
            </p>
            <p className="relative max-w-xs text-center text-sm text-slate-400">
              Auto-upgrade · matrix completion · no duplicate accounts
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
