"use client";

import { useState } from "react";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { Menu, X, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { ConnectWallet } from "@/components/web3/ConnectWallet";

const links = [
  { label: "About", href: "/#about" },
  { label: "Tokenomics", href: "/#tokenomics" },
  { label: "Network", href: "/#network" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "P2P", href: "/p2p" },
].map((l) => ({ ...l, href: withBasePath(l.href) }));

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-full border px-4 py-2.5 transition-all duration-500",
          scrolled
            ? "border-white/10 bg-ink-900/70 shadow-[0_20px_40px_-25px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        )}
      >
        <a href="#top" className="flex items-center gap-2.5 pl-1">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-600 shadow-glow">
            <Hexagon className="h-5 w-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            LAE
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ConnectWallet />
          <a href="#cta" className="btn-primary !px-5 !py-2.5">
            Buy $LAE
          </a>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-4 right-4 top-20 z-50 glass p-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-2">
                <ConnectWallet full />
              </div>
              <a href="#cta" onClick={() => setOpen(false)} className="btn-primary mt-2">
                Buy $LAE
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
