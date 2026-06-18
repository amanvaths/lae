"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { withBasePath } from "@/lib/paths";
import { shouldRedirectToComingSoon } from "@/lib/site-gate";

export function GlobalSiteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(() => {
    if (typeof window === "undefined") return true;
    return !shouldRedirectToComingSoon(pathname);
  });

  useEffect(() => {
    if (!shouldRedirectToComingSoon(pathname)) {
      setAllowed(true);
      return;
    }
    window.location.replace(withBasePath("/coming-soon"));
  }, [pathname]);

  if (!allowed) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-ink-950 px-5">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo size={56} />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
