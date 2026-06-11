"use client";

import { Globe2, Shield, Zap } from "lucide-react";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { EcosystemOrbit } from "@/components/ui/EcosystemOrbit";

const cards = [
  {
    icon: Globe2,
    title: "Meet LAE System",
    body: "LAE connects holders, payment providers and exchanges via on-chain routing to provide one frictionless experience to earn and settle globally.",
    points: ["Cross-chain connectivity", "Instant on-demand settlement", "Low operational costs"],
  },
  {
    icon: Shield,
    title: "Privacy Is Priority",
    body: "Protect your financial information. Every reward and payout is verifiable on-chain while your wallet identity stays in your control.",
    points: ["On-chain transparency", "Self-custody wallets", "Audited smart contracts"],
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    body: "Real-time traceability of funds. Rewards propagate up your network tree the moment a transaction confirms — no manual claims.",
    points: ["Real-time fund traceability", "7-level reward routing", "No hidden ledgers"],
  },
];

export function Tech() {
  return (
    <section className="section-dark py-20 sm:py-28">
      <div className="container-edge">
        <Reveal className="mb-12 text-center">
          <span className="section-label">Technology</span>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
            Technology in <span className="text-shimmer">LAE</span>
          </h2>
        </Reveal>

        <Reveal className="mb-14 flex justify-center">
          <EcosystemOrbit />
        </Reveal>

        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <Reveal key={c.title}>
              <TiltCard className="h-full [perspective:800px]">
                <div className="feature-box h-full">
                  <div className="mb-4 grid h-12 w-12 place-items-center bg-brand-500/10 text-brand-400 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                    <c.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-display text-xl font-semibold text-white">
                    {c.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-slate-400">{c.body}</p>
                  <ul className="flex flex-col gap-2">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(255,195,26,0.6)]" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
