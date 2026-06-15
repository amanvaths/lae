"use client";

import { useEffect } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { canAccessFullSite } from "@/lib/site-gate";

export default function RootGatePage() {
  useEffect(() => {
    const target = canAccessFullSite()
      ? withBasePath("/home")
      : withBasePath("/coming-soon");
    window.location.replace(target);
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink-950 px-5">
      <div className="flex flex-col items-center gap-4">
        <BrandLogo size={64} />
        <p className="text-sm text-slate-500">Redirecting…</p>
      </div>
    </main>
  );
}
