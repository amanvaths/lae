"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { withBasePath } from "@/lib/paths";
import { parseDashboardViewUserId } from "@/lib/lae-club/dashboard-view-context";

function ViewRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyId = searchParams.get("id");
  const viewUserId = parseDashboardViewUserId(searchParams.get("viewUserId") ?? legacyId);

  useEffect(() => {
    if (viewUserId) {
      router.replace(withBasePath(`/dashboard?viewUserId=${viewUserId}`));
    } else {
      router.replace(withBasePath("/login"));
    }
  }, [router, viewUserId]);

  return (
    <div className="grid min-h-[50vh] place-items-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
    </div>
  );
}

/** Legacy /view?id= — redirects to the full dashboard in read-only view mode. */
export default function ViewUserPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50vh] place-items-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <ViewRedirect />
    </Suspense>
  );
}
