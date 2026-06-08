import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/ui/Reveal";
import { withBasePath } from "@/lib/paths";
import { FileText, Download, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Whitepaper — LAE Protocol",
  description:
    "The LAE Protocol whitepaper: token, tokenomics, the on-chain network reward model, architecture, security, governance and roadmap.",
};

const PDF = withBasePath("/lae-whitepaper.pdf");

const contents = [
  "Abstract",
  "Introduction",
  "The Problem",
  "The LAE Solution",
  "Token Overview",
  "Tokenomics",
  "Network Reward Model",
  "Technical Architecture",
  "Security",
  "Roadmap",
  "Governance",
  "Risk Factors",
];

const tokenFacts = [
  ["Ticker", "$LAE"],
  ["Max supply", "1,000,000,000 (fixed)"],
  ["Standard", "ERC-20 · multi-chain"],
  ["Networks", "Ethereum · BNB · Polygon · Arbitrum"],
  ["Transaction burn", "1.5%"],
  ["Team vesting", "36 months linear"],
];

const allocation = [
  ["Network rewards", "40%"],
  ["Staking & liquidity", "22%"],
  ["Treasury", "15%"],
  ["Team (vested)", "12%"],
  ["Ecosystem fund", "8%"],
  ["Public sale", "3%"],
];

const sections = [
  {
    h: "Abstract",
    p: "LAE is a Web3 protocol that reimagines network-based growth as a transparent, on-chain rewards economy. Traditional networking and referral programs hide their ledgers, delay payouts and concentrate value with intermediaries. LAE replaces that opaque back-office with smart contracts: every referral, rank and reward is a verifiable transaction, settled instantly to self-custodied wallets.",
  },
  {
    h: "The Problem",
    p: "Legacy network and affiliate models route rewards through centralized systems members cannot audit — opaque ledgers, delayed settlement, custodial risk and value leakage to intermediaries.",
  },
  {
    h: "The LAE Solution",
    p: "LAE encodes the entire reward economy in audited smart contracts. When a member in your network transacts, the protocol automatically routes a share up the referral tree across multiple levels, settling in $LAE to each participant's wallet in the same transaction — no back-office, no manual approval, no custodian.",
  },
  {
    h: "Network Reward Model",
    p: "Rewards propagate up your referral tree: 12% on direct (Level 1), 8% on Level 2, 5% on Level 3, and a 3% depth bonus across Levels 4–7. Every rate is enforced by the contract and publicly verifiable.",
  },
  {
    h: "Security & Governance",
    p: "Contracts are independently audited with public reports; team tokens are vesting-locked. The protocol uses timelocked admin actions, circuit breakers and a bug-bounty program, and progressively decentralizes into the LAE DAO where $LAE holders govern parameters, treasury and upgrades.",
  },
];

export default function WhitepaperPage() {
  return (
    <main className="relative">
      <PageHeader />

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-14">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-lines bg-[size:64px_64px] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />
          <div className="absolute left-1/2 top-0 h-[400px] w-[760px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px]" />
        </div>
        <div className="container-edge max-w-4xl">
          <Reveal>
            <span className="chip">
              <FileText className="h-3.5 w-3.5 text-brand-400" />
              Whitepaper · v1.0 · June 2026
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl">
              The LAE Protocol
              <br />
              <span className="text-gradient">Whitepaper</span>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              A complete look at the $LAE token, its deflationary supply, the
              multi-level on-chain reward engine, technical architecture,
              security posture, governance and roadmap.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={PDF} download className="btn-primary">
                <Download className="h-4 w-4" /> Download PDF
              </a>
              <a
                href={PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Read online <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="pb-28">
        <div className="container-edge grid max-w-6xl gap-8 lg:grid-cols-[260px_1fr]">
          {/* Contents + facts */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:h-fit">
            <Reveal>
              <div className="glass p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Contents
                </p>
                <ol className="flex flex-col gap-1.5">
                  {contents.map((c, i) => (
                    <li
                      key={c}
                      className="flex items-center gap-2 text-sm text-slate-400"
                    >
                      <span className="font-mono text-xs text-brand-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {c}
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div className="glass p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Token facts
                </p>
                <div className="flex flex-col gap-2.5">
                  {tokenFacts.map(([k, v]) => (
                    <div key={k} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-slate-500">{k}</span>
                      <span className="text-right text-xs font-medium text-slate-200">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </aside>

          {/* Sections */}
          <div className="flex flex-col gap-5">
            {sections.map((s, i) => (
              <Reveal key={s.h} delay={i}>
                <article className="glass p-7 sm:p-8">
                  <h2 className="mb-3 font-display text-xl font-semibold text-white">
                    {s.h}
                  </h2>
                  <p className="text-[15px] leading-relaxed text-slate-400">
                    {s.p}
                  </p>
                </article>
              </Reveal>
            ))}

            {/* Allocation card */}
            <Reveal>
              <article className="glass p-7 sm:p-8">
                <h2 className="mb-5 font-display text-xl font-semibold text-white">
                  Tokenomics allocation
                </h2>
                <div className="flex flex-col gap-3">
                  {allocation.map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{k}</span>
                        <span className="font-mono font-semibold text-white">
                          {v}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-accent-500"
                          style={{ width: v }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>

            {/* Download CTA */}
            <Reveal>
              <article className="glass flex flex-col items-start justify-between gap-4 p-7 sm:flex-row sm:items-center sm:p-8">
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    Get the full document
                  </h3>
                  <p className="text-sm text-slate-400">
                    All 12 sections, tables and disclosures — formatted PDF.
                  </p>
                </div>
                <a href={PDF} download className="btn-primary shrink-0">
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
