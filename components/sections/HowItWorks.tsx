"use client";

import { Users, LayoutGrid, Network, Gift } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TiltCard } from "@/components/ui/TiltCard";

const steps = [
  {
    num: "01",
    title: "Join Club",
    desc: "Register with a sponsor and activate your first matrix level to enter the LAE Club ecosystem.",
    icon: Users,
  },
  {
    num: "02",
    title: "Enter Matrix",
    desc: "Your position is placed into a 14-spot smart matrix. Each level auto-upgrades on completion.",
    icon: LayoutGrid,
  },
  {
    num: "03",
    title: "Grow Network",
    desc: "Invite direct referrals and build depth across 12 levels. The matrix fills organically through spillover.",
    icon: Network,
  },
  {
    num: "04",
    title: "Receive Club Rewards",
    desc: "Earn BTC matrix income instantly on-chain, plus LAE token rewards vested over 20 months.",
    icon: Gift,
  },
];

export function HowItWorks() {
  return (
    <section id="about" className="relative scroll-mt-28 py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="How It Works"
          title={
            <>
              Four steps to{" "}
              <span className="text-gradient-gold">matrix income</span>
            </>
          }
          description="A transparent, automated business model where every action is settled on-chain."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i}>
              <TiltCard className="h-full">
                <div className="glass flex h-full flex-col gap-4 p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-brand-500/30 bg-brand-500/10 text-brand-400">
                      <s.icon className="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-bold text-white/10">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {s.desc}
                  </p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
