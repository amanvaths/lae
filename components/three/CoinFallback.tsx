"use client";

import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

/** CSS-only coin visual used when WebGL is unavailable or the context is lost. */
export function CoinFallback({
  className,
  spin = true,
}: {
  className?: string;
  spin?: boolean;
}) {
  return (
    <div className={cn("grid h-full w-full place-items-center", className)}>
      <div
        className={cn(
          "relative h-[72%] w-[72%]",
          spin ? "animate-spin-slow" : "animate-float"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={withBasePath("/lae-coin-logo.png")}
          alt="LAE Coin"
          className="h-full w-full object-contain drop-shadow-[0_0_48px_rgba(245,195,59,0.35)]"
        />
      </div>
    </div>
  );
}
