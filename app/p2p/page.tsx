import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { P2PMarketplace } from "@/components/p2p/P2PMarketplace";

export const metadata: Metadata = {
  title: "P2P Marketplace — LAE Club",
  description: "Buy and sell LAE peer-to-peer via on-chain LAECoin orders.",
};

export default function P2PPage() {
  return (
    <main className="relative min-h-screen bg-ink-950">
      <PageHeader />
      <P2PMarketplace />
      <Footer />
    </main>
  );
}
