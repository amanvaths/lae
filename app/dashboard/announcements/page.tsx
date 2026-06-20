"use client";

import { Panel } from "@/components/dashboard/ui";

export default function AnnouncementsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white">Announcements</h1>
      <p className="mt-1 text-sm text-slate-400">LAE Club updates and notifications</p>

      <Panel className="mt-6" title="Recent">
        <p className="text-sm text-slate-500">No announcements yet.</p>
      </Panel>
    </div>
  );
}
