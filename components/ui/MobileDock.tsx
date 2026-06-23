"use client";

import { motion } from "framer-motion";
import { Home, Network, Wallet, Star, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/paths";
import { useScrollSpy, sectionFromHref } from "@/lib/useScrollSpy";
import { useWeb3Loaded } from "@/app/providers";
import { useAccount } from "wagmi";
import { useClientMounted } from "@/lib/useClientMounted";

type DockLink = {
  href: string;
  label: string;
  icon: typeof Home;
};

const staticLinks: DockLink[] = [
  { href: "#top", label: "Home", icon: Home },
  { href: "#network", label: "Network", icon: Network },
  // { href: withBasePath("/p2p"), label: "P2P", icon: ArrowLeftRight }, // hidden for now
  { href: "#cta", label: "Buy", icon: Star },
];

function buildLinks(walletConnected: boolean): DockLink[] {
  return [
    staticLinks[0],
    staticLinks[1],
    {
      href: withBasePath(walletConnected ? "/dashboard" : "/login"),
      label: walletConnected ? "Dashboard" : "Connect",
      icon: walletConnected ? LayoutDashboard : Wallet,
    },
    staticLinks[2],
  ];
}

function MobileDockNav({ links }: { links: DockLink[] }) {
  const active = useScrollSpy();

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 bottom-0 z-[70] flex gap-1 border-t border-white/10 bg-ink-950/95 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      aria-label="Quick navigation"
    >
      {links.map(({ href, label, icon: Icon }) => {
        const sec = sectionFromHref(href);
        const isActive = sec === active;
        return (
          <motion.a
            key={href}
            href={href}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "bg-brand-500/10 text-brand-400"
                : "text-slate-500 hover:text-brand-400"
            )}
          >
            <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
            {label}
            {isActive && (
              <motion.span
                layoutId="dock-dot"
                className="absolute top-1 h-0.5 w-4 rounded-full bg-brand-500"
              />
            )}
          </motion.a>
        );
      })}
    </motion.nav>
  );
}

function MobileDockConnected() {
  const mounted = useClientMounted();
  const { isConnected } = useAccount();
  return <MobileDockNav links={buildLinks(mounted && isConnected)} />;
}

export function MobileDock() {
  const web3Ready = useWeb3Loaded();
  if (!web3Ready) {
    return <MobileDockNav links={buildLinks(false)} />;
  }
  return <MobileDockConnected />;
}
