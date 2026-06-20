import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { LaeOnChainP2P } from "@/components/p2p/LaeOnChainP2P";
import { Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "P2P Marketplace — LAE Club",
  description: "Buy and sell LAE peer-to-peer via on-chain LAECoin orders.",
};

export default function P2PPage() {
  return (
    <main className="relative min-h-screen">
      <PageHeader />
      <section className="relative px-5 pt-32 pb-16 sm:px-8 sm:pt-36">
        <Reveal>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">P2P Marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Create sell orders, buy from other members, or cancel your listings — powered by{" "}
            <code className="text-brand-300">LAECoin.createP2POrder</code>,{" "}
            <code className="text-brand-300">fillP2POrder</code>, and{" "}
            <code className="text-brand-300">cancelP2POrder</code>.
          </p>
        </Reveal>
        <div className="mt-10">
          <LaeOnChainP2P />
        </div>
      </section>
      <Footer />
    </main>
  );
}
