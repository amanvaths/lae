"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { withBasePath } from "@/lib/paths";

export function ViewUserBanner({ userId }: { userId: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#D4AF37]">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Viewing <strong>User #{userId}</strong> — read-only dashboard
        </span>
      </div>
      <Link
        href={withBasePath("/login")}
        className="text-xs font-semibold text-slate-400 underline-offset-2 hover:text-white hover:underline"
      >
        Connect your wallet
      </Link>
    </div>
  );
}
