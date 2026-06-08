"use client";

import { useState } from "react";
import { LifeBuoy, Send, Mail, MessageCircle, ChevronDown } from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";

const faqs = [
  { q: "How do I activate my first slot?", a: "Deposit 0.001 BTC to your wallet address, then open Deposit & Activate and confirm Slot 1. The engine auto-upgrades you from there." },
  { q: "When are withdrawals processed?", a: "Withdrawals are automatic and instant — executed by smart contract with no charges and no admin approval, confirming in under a second." },
  { q: "What is the Royal Pool?", a: "Every 4th position from each slot after the first cycle flows into the Royal Pool, split 50/50 between NFT liquidity and rank rewards." },
  { q: "How do ranks work?", a: "Ranks (Rising, Prime, Royal, Legendary) unlock at slots 3, 6, 9 and 12. Each pays a 25% reward. Refer 5 directly and upgrade them to climb." },
  { q: "Can I sell my Welcome Pass NFT?", a: "Yes — after the 100-day lock period you can sell it anytime at the live market rate. It can appreciate from 0.001 BTC toward 1 BTC." },
];

const tickets = [
  { id: "TK-3391", subject: "Slot 5 activation confirmation", status: "open", date: "2026-06-07" },
  { id: "TK-3380", subject: "NFT unlock date query", status: "resolved", date: "2026-06-02" },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div>
      <PageHeading
        icon={LifeBuoy}
        title="Support"
        subtitle="Get help with your account, slots, withdrawals and more. Our team typically responds within a few hours."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, label: "Email", value: "support@btitan.net" },
          { icon: Send, label: "Telegram", value: "@btitan_support" },
          { icon: MessageCircle, label: "Live chat", value: "Available 24/7" },
        ].map((c) => (
          <div key={c.label} className="glass flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-brand-300">
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className="text-sm font-medium text-white">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Open a ticket">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-3">
            <input placeholder="Subject" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-brand-500/50" />
            <select className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-brand-500/50">
              <option className="bg-ink-900">Slots & activation</option>
              <option className="bg-ink-900">Withdrawals</option>
              <option className="bg-ink-900">Royal Pool & ranks</option>
              <option className="bg-ink-900">NFT</option>
              <option className="bg-ink-900">Other</option>
            </select>
            <textarea rows={4} placeholder="Describe your issue…" className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-brand-500/50" />
            <button className="btn-primary justify-center">
              <Send className="h-4 w-4" /> Submit ticket
            </button>
          </form>

          <div className="mt-5">
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">Your tickets</p>
            <div className="flex flex-col gap-2">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{t.subject}</p>
                    <p className="text-xs text-slate-500">{t.id} · {t.date}</p>
                  </div>
                  <Pill tone={t.status === "open" ? "gold" : "emerald"}>{t.status}</Pill>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Frequently asked">
          <div className="flex flex-col gap-2">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-white">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <p className="px-4 pb-3 text-sm leading-relaxed text-slate-400">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
