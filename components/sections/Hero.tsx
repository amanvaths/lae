"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { CoinFallback } from "@/components/three/CoinFallback";
import { useDeferredReady, useIsMobile, usePrefersReducedMotion } from "@/lib/useDeferredReady";
import { useWeb3Loaded } from "@/app/providers";
import { useAccount } from "wagmi";

const NetworkCanvas = dynamic(
  () => import("@/components/ui/NetworkCanvas").then((m) => m.NetworkCanvas),
  { ssr: false }
);

const LaeCoin = dynamic(() => import("@/components/three/LaeCoin"), {
  ssr: false,
  loading: () => <CoinFallback spin={false} className="h-full w-full" />,
});

const SLIDE_MS = 6000;

const slides = [
  {
    label: "Decentralization revolution of network rewards",
    title: (
      <>
        Your Network,
        <br />
        <span className="text-shimmer">Now An Asset.</span>
      </>
    ),
    desc: (
      <>
        <strong className="text-white">$LAE</strong> is a decentralised on-chain
        network token — fully open, fully transparent. Build your tree, earn on
        every level, and own your growth with no middlemen.
      </>
    ),
    primary: { href: "#cta", label: "Get $LAE" },
    secondary: { href: "#network", label: "Explore Plan" },
  },
  {
    label: "Network-to-earn · Web3",
    title: (
      <>
        LAE Tech
        <br />
        <span className="text-shimmer">Change The World</span>
      </>
    ),
    desc: (
      <>
        Every connection strengthens the protocol and pays you in $LAE —
        automatically, on every level of your tree. No hidden ledgers, no
        back-office delays.
      </>
    ),
    primary: { href: withBasePath("/login"), label: "Connect Wallet" },
    secondary: { href: withBasePath("/whitepaper"), label: "Whitepaper" },
  },
];

const ease = [0.22, 1, 0.36, 1] as const;

const slideVariants = {
  enter: { opacity: 0, x: 32 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -32 },
};

function HeroSlideActions({
  slideIndex,
  primary,
  secondary,
}: {
  slideIndex: number;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}) {
  const web3Ready = useWeb3Loaded();
  const isConnectSlide = slideIndex === 1;

  if (isConnectSlide && web3Ready) {
    return <HeroConnectSlideActions secondary={secondary} />;
  }

  const href =
    isConnectSlide && !web3Ready ? withBasePath("/login") : primary.href;
  const label = isConnectSlide && !web3Ready ? "Connect Wallet" : primary.label;

  return (
    <div className="flex flex-wrap gap-3">
      <a href={href} className="btn-primary group">
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
      <a href={secondary.href} className="btn-ghost">
        {secondary.label}
      </a>
    </div>
  );
}

function HeroConnectSlideActions({
  secondary,
}: {
  secondary: { href: string; label: string };
}) {
  const { isConnected } = useAccount();

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={withBasePath(isConnected ? "/dashboard" : "/login")}
        className="btn-primary group"
      >
        {isConnected ? "Dashboard" : "Connect Wallet"}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
      <a href={secondary.href} className="btn-ghost">
        {secondary.label}
      </a>
    </div>
  );
}

function HeroCoin() {
  const deferred = useDeferredReady(2000);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  if (mobile || reduced || !deferred) {
    return <CoinFallback spin={false} className="h-full w-full" />;
  }
  return <LaeCoin className="h-full w-full" />;
}

export function Hero() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showFx, setShowFx] = useState(false);
  const visualRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const t = window.setTimeout(() => setShowFx(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  const goTo = useCallback((i: number) => {
    setIndex((i + slides.length) % slides.length);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (paused || reduced) return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / SLIDE_MS, 1);
      setProgress(p);
      if (p >= 1) {
        setIndex((i) => (i + 1) % slides.length);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, paused, reduced]);

  useEffect(() => {
    const section = sectionRef.current;
    const el = visualRef.current;
    if (!section || !el || reduced) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 14;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 14;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      });
    };

    section.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      section.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative overflow-hidden bg-ink-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {showFx && !reduced && <NetworkCanvas className="absolute inset-0" />}
      {!reduced && <div className="scanline hidden md:block" />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(255,195,26,0.08),transparent)]" />

      <div className="container-edge relative grid min-h-[calc(100dvh-110px)] items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
        <div className="relative z-10 min-h-[340px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease }}
              className="flex flex-col items-start gap-6"
            >
              <span className="chip">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-emerald-400" />
                {slides[index].label}
              </span>
              <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl xl:text-6xl">
                {slides[index].title}
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-400 sm:text-lg">
                {slides[index].desc}
              </p>
              <HeroSlideActions
                slideIndex={index}
                primary={slides[index].primary}
                secondary={slides[index].secondary}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="group relative h-1 w-10 overflow-hidden rounded-full bg-white/10"
              >
                <span
                  className={cn(
                    "absolute inset-y-0 left-0 bg-brand-500 transition-all duration-300",
                    i === index ? "opacity-100" : "w-0 opacity-0 group-hover:w-full group-hover:opacity-40"
                  )}
                  style={i === index ? { width: `${progress * 100}%` } : undefined}
                />
              </button>
            ))}
          </div>
        </div>

        <div
          ref={visualRef}
          className="relative mx-auto aspect-square w-full max-w-[520px] will-change-transform"
        >
          {!reduced && (
            <>
              <div className="absolute inset-[-8%] animate-orbit rounded-full border border-dashed border-brand-500/15" />
              <div
                className="absolute inset-[-4%] rounded-full border border-brand-500/10"
                style={{ animation: "orbit 20s linear infinite reverse" }}
              />
            </>
          )}
          <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-3xl" />
          <HeroCoin />
          {!reduced && (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 top-8 border border-brand-500/20 bg-ink-950/90 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-slate-500">Launch price</p>
                <p className="font-mono text-lg font-bold text-white">$0.10</p>
                <p className="text-xs font-medium text-emerald-400">500K supply</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 right-0 border border-brand-500/20 bg-ink-950/90 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-slate-500">Ecosystem target</p>
                <p className="font-mono text-lg font-bold text-brand-400">Up To 1 BTC</p>
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className="relative border-t border-white/5 bg-ink-950/60 py-3">
        <div className="flex w-max animate-marquee items-center gap-10 px-4 text-xs font-medium uppercase tracking-widest text-slate-600">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center gap-10 whitespace-nowrap">
              <span>BNB Chain</span>
              <span>CertiK Audited</span>
              <span>Chainlink Oracles</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
