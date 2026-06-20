"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { useScrollSpy, sectionFromHref } from "@/lib/useScrollSpy";
import { useWeb3Loaded } from "@/app/providers";
// import { TopBar } from "@/components/ui/TopBar";
import { BrandLogo } from "@/components/ui/BrandLogo";

// ConnectWallet removed — using Login/Register buttons instead

const links = [
  { label: "Home", href: "/#top" },
  { label: "Club", href: "/#about" },
  { label: "Matrix", href: "/#network" },
  { label: "Rewards", href: "/#rewards" },
  { label: "Token", href: "/#tokenomics" },
  { label: "FAQ", href: "/#faq" },
].map((l) => ({ ...l, href: l.href.startsWith("/#") ? withBasePath(l.href) : l.href }));

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
  const web3Ready = useWeb3Loaded();
  const { isConnected } = useAccount();
  const showDashboard = web3Ready && isConnected;

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
            <BrandLogo size={44} />
            <span className="font-display text-lg font-semibold text-white">
              LAE<span className="font-normal text-slate-400"> Club</span>
            </span>
          </motion.a>

          <nav className="hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <NavItem key={l.href} href={l.href} label={l.label} active={linkActive(l.href)} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {showDashboard ? (
              <motion.a
                href={withBasePath("/dashboard")}
                className="btn-primary !px-5 !py-2.5 !text-xs"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Dashboard
              </motion.a>
            ) : (
              <>
                <motion.a
                  href={withBasePath("/login")}
                  className="btn-ghost !px-5 !py-2.5 !text-xs"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Login
                </motion.a>
                <motion.a
                  href={withBasePath("/register")}
                  className="btn-primary !px-5 !py-2.5 !text-xs"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Register
                </motion.a>
              </>
            )}
            <motion.a
              href={withBasePath("/coin")}
              className="btn-ghost !px-5 !py-2.5 !text-xs"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              LAE Coin
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
                  {showDashboard ? (
                    <a
                      href={withBasePath("/dashboard")}
                      onClick={() => setOpen(false)}
                      className="btn-primary mb-3 w-full"
                    >
                      Dashboard
                    </a>
                  ) : (
                    <>
                      <a
                        href={withBasePath("/login")}
                        onClick={() => setOpen(false)}
                        className="btn-ghost mb-2 w-full"
                      >
                        Login
                      </a>
                      <a
                        href={withBasePath("/register")}
                        onClick={() => setOpen(false)}
                        className="btn-primary mb-3 w-full"
                      >
                        Register
                      </a>
                    </>
                  )}
                  <a href={withBasePath("/coin")} onClick={() => setOpen(false)} className="btn-ghost mt-3 w-full">
                    LAE Coin
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
