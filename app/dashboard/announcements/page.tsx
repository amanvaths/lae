"use client";

import { Megaphone } from "lucide-react";
import { PageHeading, Panel, Pill } from "@/components/dashboard/ui";
import { announcements } from "@/lib/dashboard-data";

const tagTone: Record<string, "brand" | "violet" | "gold" | "emerald"> = {
  Milestone: "gold",
  NFT: "violet",
  Network: "brand",
  Rewards: "emerald",
};

export default function AnnouncementsPage() {
  return (
    <div>
      <PageHeading
        icon={Megaphone}
        title="Announcements"
        subtitle="Real-time updates from the B-Titan network — milestones, NFT liquidity, rewards and protocol news."
      />

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Panel key={a.id} className="!p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-brand-300">
                <Megaphone className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-white">{a.title}</h3>
                  <Pill tone={tagTone[a.tag] ?? "slate"}>{a.tag}</Pill>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{a.body}</p>
                <p className="mt-2 text-xs text-slate-600">{a.date}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
