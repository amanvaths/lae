import dynamic from "next/dynamic";
import { Navbar } from "@/components/sections/Navbar";
import { HeroClub } from "@/components/sections/HeroClub";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SmartMatrix } from "@/components/sections/SmartMatrix";
import { BusinessModel } from "@/components/sections/BusinessModel";
import { RewardTimeline } from "@/components/sections/RewardTimeline";
import { GrowthJourney } from "@/components/sections/GrowthJourney";
import { P2PSection } from "@/components/sections/P2PSection";
import { TokenInfo } from "@/components/sections/TokenInfo";
import { Team } from "@/components/sections/Team";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { MobileDock } from "@/components/ui/MobileDock";
import { SectionDivider } from "@/components/ui/SectionDivider";

const FAQ = dynamic(
  () => import("@/components/sections/FAQ").then((m) => ({ default: m.FAQ }))
);

export default function HomePage() {
  return (
    <main className="relative pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <ScrollProgress />
      <Navbar />
      <HeroClub />
      <HowItWorks />
      <SectionDivider />
      <SmartMatrix />
      <SectionDivider />
      <BusinessModel />
      <RewardTimeline />
      <SectionDivider />
      <GrowthJourney />
      <P2PSection />
      <SectionDivider />
      <TokenInfo />
      <SectionDivider />
      <Team />
      <FAQ />
      <Footer />
      <MobileDock />
    </main>
  );
}
