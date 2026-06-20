import { Suspense } from "react";
import LegacyRegisterRedirect from "./redirect-client";

export default function LegacyRegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-ink-950 text-slate-400">
          Redirecting…
        </main>
      }
    >
      <LegacyRegisterRedirect />
    </Suspense>
  );
}
