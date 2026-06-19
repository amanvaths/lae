"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/paths";

/** P2P marketplace hidden for now — UI preserved in `components/p2p/` and comment block below. */
export default function P2PPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(withBasePath("/"));
  }, [router]);

  return null;
}

/*
// --- P2P page (disabled — restore when re-enabling) ---
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { P2PMarket } from "@/components/p2p/P2PMarket";
import { Reveal } from "@/components/ui/Reveal";
import {
  ShieldCheck,
  Lock,
  Scale,
  Globe2,
  Zap,
  Users,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "P2P Marketplace — LAE Protocol",
  description:
    "Buy and sell $LAE peer-to-peer with on-chain smart-contract escrow.",
};

export default function P2PPage() {
  return (
    <main className="relative min-h-screen">
      <PageHeader />
      <section className="relative overflow-hidden px-5 pt-32 pb-10 sm:px-8 sm:pt-36">
        ...
        <P2PMarket />
      </section>
      <Footer />
    </main>
  );
}
*/
