"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { useScrollSpy, sectionFromHref } from "@/lib/useScrollSpy";
// import { TopBar } from "@/components/ui/TopBar";
import { BrandLogo } from "@/components/ui/BrandLogo";

const ConnectWallet = dynamic(
  () => import("@/components/web3/ConnectWallet").then((m) => m.ConnectWallet),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex h-10 items-center rounded-sm border border-white/10 px-4 text-xs text-slate-400">
        Connect
      </span>
    ),
  }
);

const links = [
  { label: "Home", href: "/#top" },
  { label: "About", href: "/#about" },
  { label: "Tokenomics", href: "/#tokenomics" },
  { label: "Network", href: "/#network" },
  { label: "Roadmap", href: "/#roadmap" },
  { label: "FAQ", href: "/#faq" },
  // { label: "P2P", href: "/p2p" }, // hidden for now
].map((l) => ({ ...l, href: withBasePath(l.href) }));

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "relative px-4 py-2 text-sm font-medium transition-colors",
        active ? "text-brand-400" : "text-slate-300 hover:text-brand-400"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 bg-brand-500 transition-all duration-300",
          active ? "w-3/4" : "w-0"
        )}
      />
    </a>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const active = useScrollSpy();
  const linkActive = (href: string) => sectionFromHref(href) === active;

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 20));

  return (
    <>
      {/* <TopBar /> — hidden for now */}
      <motion.header
        className={cn(
          "sticky top-0 z-50 border-b bg-ink-900/95 backdrop-blur-md transition-shadow duration-300",
          scrolled ? "border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]" : "border-white/5"
        )}
      >
        <div className="container-edge flex h-[70px] items-center justify-between">
          <motion.a
            href="#top"
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <BrandLogo />
            <span className="font-display text-lg font-semibold text-white">
              LAE<span className="font-normal text-slate-400">Protocol</span>
            </span>
          </motion.a>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <NavItem key={l.href} href={l.href} label={l.label} active={linkActive(l.href)} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ConnectWallet />
            <motion.a
              href="#cta"
              className="btn-primary !px-5 !py-2.5 !text-xs"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Buy $LAE
            </motion.a>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center border border-white/10 text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/5 bg-ink-900 lg:hidden"
            >
              <div className="container-edge flex flex-col gap-1 py-4">
                {links.map((l, i) => (
                  <motion.a
                    key={l.href}
                    href={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-3 py-3 text-sm font-medium",
                      linkActive(l.href) ? "text-brand-400" : "text-slate-200"
                    )}
                  >
                    {l.label}
                  </motion.a>
                ))}
                <div className="mt-3 border-t border-white/5 pt-3">
                  <ConnectWallet full />
                  <a href="#cta" onClick={() => setOpen(false)} className="btn-primary mt-3 w-full">
                    Buy $LAE
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
