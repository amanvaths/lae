"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Eye } from "lucide-react";
import { PublicUserDashboard } from "@/components/lae-club/PublicUserDashboard";
import { ViewUserIdPanel } from "@/components/lae-club/ViewUserIdPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";

export default function ViewUserPage() {
  const params = useParams();
  const userId = String(params.id ?? "");

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-ink-950">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <Link href={withBasePath("/")} className="flex items-center gap-2">
            <BrandLogo size={36} />
            <span className="font-display font-bold text-white">LAE Club</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-400 sm:text-sm">
            <Eye className="h-4 w-4 text-brand-400" />
            Public viewer · User #{userId}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px]">
        <PublicUserDashboard userId={userId} />
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ViewUserIdPanel />
          <p className="mt-3 text-center text-xs text-slate-500">
            <Link href={withBasePath("/register")} className="text-brand-300 hover:underline">
              ← Back to register
            </Link>
          </p>
        </aside>
      </div>
    </main>
  );
}
