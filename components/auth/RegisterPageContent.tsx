"use client";

import { BrandLogo } from "@/components/ui/BrandLogo";
import { LaeRegisterPanel } from "@/components/lae-club/LaeRegisterPanel";

export function RegisterPageContent() {
  return (
    <>
      <div className="mb-6 text-center">
        <BrandLogo size={56} className="mx-auto" />
        <h1 className="mt-4 font-display text-xl font-bold text-white sm:text-2xl">
          Join{" "}
          <span className="text-gradient-gold">LAE Club Network</span>
        </h1>
        <p className="mt-2 text-xs text-slate-500">
          On-chain registration · BSC Testnet · BUSD payment
        </p>
      </div>

      <LaeRegisterPanel luxury />
    </>
  );
}
