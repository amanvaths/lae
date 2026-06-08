import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { About } from "@/components/sections/About";
import { Tokenomics } from "@/components/sections/Tokenomics";
import { NetworkPlan } from "@/components/sections/NetworkPlan";
import { Roadmap } from "@/components/sections/Roadmap";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export default function Home() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Navbar />
      <Hero />
      <Stats />
      <About />
      <Tokenomics />
      <NetworkPlan />
      <Roadmap />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
