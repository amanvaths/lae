"use client";

import { useEffect } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";

/** App entry — go straight to wallet login (skip LAE marketing home). */
export default function RootGatePage() {
  useEffect(() => {
    window.location.replace(withBasePath("/login"));
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink-950 px-5">
      <div className="flex flex-col items-center gap-4">
        <BrandLogo size={64} />
        <p className="text-sm text-slate-500">Opening LAE dashboard…</p>
      </div>
    </main>
  );
}
