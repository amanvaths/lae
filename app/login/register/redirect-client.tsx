"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/paths";

/** Legacy Senso register path — redirect to LAE Club registration. */
export default function LegacyRegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref") ?? searchParams.get("sponsor");
    const qs =
      ref && ref.length > 0 && !ref.startsWith("0x")
        ? `?ref=${encodeURIComponent(ref)}`
        : "";
    router.replace(withBasePath(`/register${qs}`));
  }, [router, searchParams]);

  return (
    <main className="grid min-h-screen place-items-center bg-ink-950 text-slate-400">
      Redirecting to LAE Club registration…
    </main>
  );
}
