"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What exactly is $LAE?",
    a: "$LAE is a Web3 token that powers a transparent, on-chain networking economy. Instead of a hidden back-office tracking your referrals and rewards, everything lives on the blockchain — verifiable, instant and owned by you.",
  },
  {
    q: "How do network rewards work?",
    a: "When someone in your network transacts, a share is routed up your tree automatically by the smart contract. You earn on up to 7 levels — 12% on direct referrals, scaling down through deeper levels. No claims, no waiting.",
  },
  {
    q: "Is the contract audited?",
    a: "Yes. The LAE contract has been audited by independent security firms, and the report is public. Team tokens are locked in a vesting contract over 36 months to align long-term incentives.",
  },
  {
    q: "Which wallets and chains are supported?",
    a: "Any standard Web3 wallet (MetaMask, Rabby, WalletConnect-compatible apps). LAE is live on Ethereum with bridges to BNB Chain, Polygon and Arbitrum rolling out in Q3.",
  },
  {
    q: "How is supply controlled?",
    a: "Supply is fixed at 1,000,000,000 $LAE — no minting, ever. A 1.5% burn on transactions makes the token deflationary as network activity grows.",
  },
  {
    q: "Do I need to buy in to start earning?",
    a: "You can hold $LAE and start building your network immediately. Staking unlocks higher reward tiers and APY, but the core network-to-earn mechanic is open to every holder.",
  },
];

function Row({ q, a, i }: { q: string; a: string; i: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={i}>
      <div
        className={cn(
          "glass overflow-hidden transition-colors",
          open && "border-white/20"
        )}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        >
          <span className="font-medium text-white">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.3 }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-brand-300"
          >
            <Plus className="h-4 w-4" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">
                {a}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="container-edge">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Everything you need to know before you join the network."
        />
        <div className="mx-auto mt-14 flex max-w-3xl flex-col gap-3">
          {faqs.map((f, i) => (
            <Row key={f.q} q={f.q} a={f.a} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
