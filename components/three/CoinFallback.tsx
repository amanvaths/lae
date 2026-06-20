"use client";

import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

/** CSS-only coin visual — transparent PNG, circular glow (no black square). */
export function CoinFallback({
  className,
  spin = true,
}: {
  className?: string;
  spin?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 grid place-items-center",
        className
      )}
    >
      <div
        className={cn(
          "relative aspect-square w-[min(72%,360px)] max-w-[360px]",
          spin ? "animate-spin-slow" : "animate-float"
        )}
      >
        <div className="absolute inset-[-8%] rounded-full bg-brand-500/15 blur-2xl" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath("/lae-coin.png")}
          alt="LAE Coin"
          className="relative h-full w-full rounded-full object-contain drop-shadow-[0_0_48px_rgba(245,195,59,0.4)]"
        />
      </div>
    </div>
  );
}
