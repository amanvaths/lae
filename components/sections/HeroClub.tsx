"use client";

import { motion } from "framer-motion";
import { withBasePath } from "@/lib/paths";

const stats = [
  { value: "12", label: "Levels" },
  { value: "14", label: "Spots" },
  { value: "90%", label: "Matrix" },
  { value: "20", label: "Month Rewards" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function HeroClub() {
  return (
    <section
      id="top"
      className="relative flex min-h-[90vh] items-center overflow-hidden bg-[#0a0a0f] py-24 sm:py-32"
    >
      {/* animated dot grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_1px_at_center,rgba(255,195,26,0.12)_0%,transparent_100%)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black_30%,transparent_100%)]" />
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500/[0.04] blur-[120px]" />
      </div>

      <div className="container-edge relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Crown Logo */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <div className="relative mx-auto h-28 w-28 sm:h-36 sm:w-36">
            <div className="absolute inset-0 animate-pulse-glow rounded-full bg-brand-500/20 blur-2xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath("/lae-club-logo.png")}
              alt="LAE Club"
              className="relative h-full w-full rounded-2xl object-contain drop-shadow-[0_0_40px_rgba(255,195,26,0.5)]"
            />
          </div>
        </motion.div>

        <motion.span
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="section-label mb-6"
        >
          Decentralized Business Network
        </motion.span>

        <motion.h1
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Build Your Network.{" "}
          <span className="text-gradient-gold">Grow Your Club.</span>
          <br />
          Earn Through Matrix Participation.
        </motion.h1>

        <motion.p
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          LAE Club is a decentralized networking platform powered by a proven
          14-spot matrix system with long-term reward mechanics.
        </motion.p>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <motion.a
            href={withBasePath("/register")}
            className="btn-primary !px-8 !py-3.5 !text-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            Join Club
          </motion.a>
          <motion.a
            href={withBasePath("/#network")}
            className="btn-ghost !px-8 !py-3.5 !text-sm"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            View Matrix
          </motion.a>
        </motion.div>

        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass flex flex-col items-center gap-1 px-4 py-5"
            >
              <span className="font-display text-2xl font-bold text-brand-400 sm:text-3xl">
                {s.value}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-500">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
