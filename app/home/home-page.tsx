import dynamic from "next/dynamic";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Vision } from "@/components/sections/Vision";
import { AboutLae } from "@/components/sections/AboutLae";
import { Features } from "@/components/sections/Features";
import { CommunityDistribution } from "@/components/sections/CommunityDistribution";
import { SmartMatrix } from "@/components/sections/SmartMatrix";
import { CommunityGrowth } from "@/components/sections/CommunityGrowth";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { LiveTicker } from "@/components/ui/LiveTicker";
import { MobileDock } from "@/components/ui/MobileDock";
import { PartnersStrip } from "@/components/ui/PartnersStrip";
import { SectionDivider } from "@/components/ui/SectionDivider";

const Tech = dynamic(
  () => import("@/components/sections/Tech").then((m) => ({ default: m.Tech }))
);
const Stats = dynamic(
  () => import("@/components/sections/Stats").then((m) => ({ default: m.Stats }))
);
const Tokenomics = dynamic(
  () => import("@/components/sections/Tokenomics").then((m) => ({ default: m.Tokenomics }))
);
const Roadmap = dynamic(
  () => import("@/components/sections/Roadmap").then((m) => ({ default: m.Roadmap }))
);
const FAQ = dynamic(
  () => import("@/components/sections/FAQ").then((m) => ({ default: m.FAQ }))
);
const CTA = dynamic(
  () => import("@/components/sections/CTA").then((m) => ({ default: m.CTA }))
);

export default function HomePage() {
  return (
    <main className="relative pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <ScrollProgress />
      <LiveTicker />
      <Navbar />
      <Hero />
      <PartnersStrip />
      <Vision />
      <SectionDivider />
      <AboutLae />
      <Tokenomics />
      <CommunityDistribution />
      <SmartMatrix />
      <CommunityGrowth />
      <SectionDivider />
      <Features />
      <Tech />
      <Stats />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
      <MobileDock />
    </main>
  );
}
