"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";

export function Intro() {
  return (
    <section className="relative overflow-hidden border-y border-white/5 bg-ink-950 py-16 sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 select-none font-serif text-[7rem] leading-none text-brand-500/[0.06]">
        &ldquo;
      </div>
      <div className="container-edge">
        <Reveal>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-8 h-px max-w-xs origin-center bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"
          />
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">
              In a world where billions are connected online and assets move
              digitally —{" "}
              <strong className="font-semibold text-white">
                network rewards still run on hidden ledgers built before Web3.
              </strong>
            </p>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base"
            >
              Why? Traditional network plans gate payouts behind back-offices.
              LAE puts the entire economy on-chain — fair, instant and
              impossible to fake.
            </motion.p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
