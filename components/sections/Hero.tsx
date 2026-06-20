"use client";

import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";
import { useWeb3Loaded } from "@/app/providers";
import { useAccount } from "wagmi";
import { useLaeUser } from "@/lib/lae-club/hooks";

const NetworkCanvas = dynamic(
  () => import("@/components/ui/NetworkCanvas").then((m) => m.NetworkCanvas),
  { ssr: false }
);

const SLIDE_MS = 6000;

const slides = [
  {
    label: "LAE Club · On-chain matrix",
    title: (
      <>
        LAE Club
        <br />
        <span className="text-shimmer">Matrix Business</span>
      </>
    ),
    desc: (
      <>
        Join the <strong className="text-white">LAE Club Matrix</strong> — a transparent 14-spot,
        12-level referral system. Matrix income is paid in BTC/USDT directly from the smart contract.
      </>
    ),
    primary: { href: withBasePath("/register"), label: "Join LAE Club" },
    secondary: { href: "#network", label: "View Matrix" },
  },
  {
    label: "12 levels · auto upgrade",
    title: (
      <>
        12 Levels
        <br />
        <span className="text-shimmer">Auto Upgrade</span>
      </>
    ),
    desc: (
      <>
        Each level doubles in entry cost. Spot 5 triggers automatic level upgrades. Royal rank NFTs
        unlock at levels 3, 6, 9, and 12.
      </>
    ),
    primary: { href: withBasePath("/login"), label: "Connect Wallet" },
    secondary: { href: withBasePath("/dashboard/matrix"), label: "Open Matrix" },
  },
  {
    label: "14-spot BTitan system",
    title: (
      <>
        14 Spot
        <br />
        <span className="text-shimmer">Matrix System</span>
      </>
    ),
    desc: (
      <>
        Upline spill, downline spill-under, recycle on spot 14, and royal pool routing — identical
        BTitan placement logic, deployed on BNB Chain.
      </>
    ),
    primary: { href: "#network", label: "Explore 14 Spots" },
    secondary: { href: withBasePath("/whitepaper"), label: "Whitepaper" },
  },
  {
    label: "Club business model",
    title: (
      <>
        Club
        <br />
        <span className="text-shimmer">Business</span>
      </>
    ),
    desc: (
      <>
        90% of registration payment funds matrix distribution. 10% goes to liquidity. Build your team,
        earn matrix income, and grow through spillover placement.
      </>
    ),
    primary: { href: withBasePath("/register"), label: "Register Now" },
    secondary: { href: withBasePath("/dashboard/team"), label: "My Team" },
  },
  {
    label: "LAE reward layer",
    title: (
      <>
        LAE
        <br />
        <span className="text-shimmer">Rewards</span>
      </>
    ),
    desc: (
      <>
        LAE Coin is a separate reward layer — locked 20 months, 5% monthly release, direct
        qualification required. Claim from your dashboard when eligible.
      </>
    ),
    primary: { href: withBasePath("/dashboard/rewards"), label: "LAE Rewards" },
    secondary: { href: withBasePath("/coin"), label: "About LAE Coin" },
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
  const user = useLaeUser();
  const registered = user.registered;

  if (isConnected && registered) {
    return (
      <div className="flex flex-wrap gap-3">
        <a href={withBasePath("/dashboard")} className="btn-primary group">
          Go To Dashboard
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
        <a href={secondary.href} className="btn-ghost">
          {secondary.label}
        </a>
      </div>
    );
  }

  if (isConnected && !registered) {
    return (
      <div className="flex flex-wrap gap-3">
        <a href={withBasePath("/register")} className="btn-primary group">
          Complete Registration
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
        <a href={withBasePath("/dashboard")} className="btn-ghost">
          Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a href={withBasePath("/login")} className="btn-primary group">
        Login
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </a>
      <a href={withBasePath("/register")} className="btn-ghost">
        Register
      </a>
    </div>
  );
}

/** After wallet connect on landing, show the dashboard slide and scroll to hero. */
function useHeroConnectFocus(goTo: (index: number) => void) {
  const { isConnected } = useAccount();
  const prevConnected = useRef(isConnected);

  useEffect(() => {
    if (isConnected && !prevConnected.current) {
      goTo(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash && window.location.hash !== "#top") {
        window.history.replaceState(null, "", withBasePath("/#top"));
      }
    }
    prevConnected.current = isConnected;
  }, [isConnected, goTo]);
}

function HeroMatrixVisual() {
  const spots = [
    "U1", "U2", "You", "Royal", "Upg", "You", "Dn1", "You", "You", "Dn1", "You", "You", "Dn2", "Cycle",
  ];
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border border-brand-500/20 bg-ink-950/80 p-6 backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-400">LAE Club Matrix</p>
      <p className="mt-1 font-display text-2xl font-bold text-white">12 Levels · 14 Spots</p>
      <div className="mt-6 grid grid-cols-7 gap-1.5 sm:gap-2">
        {spots.map((label, i) => (
          <div
            key={i}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[0.55rem] font-semibold text-slate-300 sm:h-10 sm:w-10 sm:text-[0.6rem]"
            title={`Spot ${i + 1}`}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-[0.65rem] text-slate-500">
        <span>90% matrix</span>
        <span>·</span>
        <span>10% liquidity</span>
        <span>·</span>
        <span>LAE rewards locked</span>
      </div>
    </div>
  );
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

  useHeroConnectFocus(goTo);

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
          <HeroMatrixVisual />
          {!reduced && (
            <>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 top-8 border border-brand-500/20 bg-ink-950/90 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-slate-500">Matrix levels</p>
                <p className="font-mono text-lg font-bold text-white">12</p>
                <p className="text-xs font-medium text-emerald-400">Auto upgrade</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-10 right-0 border border-brand-500/20 bg-ink-950/90 px-4 py-3 backdrop-blur-md"
              >
                <p className="text-xs text-slate-500">Spots per cycle</p>
                <p className="font-mono text-lg font-bold text-brand-400">14</p>
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
