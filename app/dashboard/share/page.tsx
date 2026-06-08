"use client";

import { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Twitter,
  Send,
  MessageCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { PageHeading, Panel, StatCard } from "@/components/dashboard/ui";
import { user, teamStats, directReferrals, fmtBtc } from "@/lib/dashboard-data";

export default function SharePage() {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const copy = (val: string, which: "link" | "code") => {
    navigator.clipboard?.writeText(val);
    setCopied(which);
    setTimeout(() => setCopied(null), 1600);
  };
  const directEarned = directReferrals.reduce((a, d) => a + d.earned, 0);

  const share = [
    { icon: Twitter, label: "Twitter / X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join me on B-Titan — the smart side of Bitcoin! " + user.referralLink)}` },
    { icon: Send, label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(user.referralLink)}` },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent("Join me on B-Titan: " + user.referralLink)}` },
  ];

  return (
    <div>
      <PageHeading
        icon={Share2}
        title="Referral Link"
        subtitle="Share your link to grow your direct team. Every member you bring strengthens your matrix and pays you on every level."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total team" value={teamStats.total.toLocaleString()} icon={Users} accent="brand" />
        <StatCard label="Direct referrals" value={directReferrals.length} accent="violet" />
        <StatCard label="Referral earnings" value={fmtBtc(directEarned, 4)} icon={TrendingUp} accent="gold" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Your referral link">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-brand-200">
              {user.referralLink}
            </code>
            <button onClick={() => copy(user.referralLink, "link")} className="btn-primary shrink-0 !py-3">
              {copied === "link" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-xs text-slate-500">Referral code</p>
                <p className="font-mono text-sm font-semibold text-white">{user.referralCode}</p>
              </div>
              <button onClick={() => copy(user.referralCode, "code")} className="text-slate-400 hover:text-white">
                {copied === "code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <p className="mb-2 mt-6 text-xs uppercase tracking-wider text-slate-500">Share via</p>
          <div className="flex flex-wrap gap-2">
            {share.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !px-4 !py-2.5 text-sm"
              >
                <s.icon className="h-4 w-4" /> {s.label}
              </a>
            ))}
          </div>
        </Panel>

        <Panel title="Scan to join">
          <div className="grid place-items-center rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="grid grid-cols-9 gap-0.5">
              {Array.from({ length: 81 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-[2px] ${
                    (i * 3 + (i % 7) + (i % 4)) % 3 === 0 ? "bg-white" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Point a camera to open your referral link.
          </p>
        </Panel>
      </div>
    </div>
  );
}
