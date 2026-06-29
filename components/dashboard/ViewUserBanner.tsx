"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, LogOut } from "lucide-react";
import { clearDashboardViewUserId } from "@/lib/lae-club/dashboard-view-context";
import { withBasePath } from "@/lib/paths";

export function ViewUserBanner({ userId }: { userId: number }) {
  const router = useRouter();

  function exitView() {
    clearDashboardViewUserId();
    router.push(withBasePath("/login"));
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Viewing <strong>User #{userId}</strong> — read-only dashboard
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href={withBasePath("/login")}
          onClick={clearDashboardViewUserId}
          className="text-xs font-semibold text-slate-400 underline-offset-2 hover:text-white hover:underline"
        >
          Connect your wallet
        </Link>
        <button
          type="button"
          onClick={exitView}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit view
        </button>
      </div>
    </div>
  );
}
