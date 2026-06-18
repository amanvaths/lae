"use client";

import { useEffect } from "react";
import { withBasePath } from "@/lib/paths";

/** Legacy /home → root landing (preserve #hash anchors). */
export default function HomeRedirectPage() {
  useEffect(() => {
    const hash = window.location.hash || "";
    window.location.replace(withBasePath("/") + hash);
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-ink-950 px-5">
      <p className="text-sm text-slate-500">Redirecting…</p>
    </main>
  );
}
