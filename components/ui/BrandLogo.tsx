import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export type LogoVariant = "club" | "coin";

const LOGO_SRC = {
  club: "/lae-club-logo.png",
  coin: "/lae-coin-logo.png",
} as const;

export function BrandLogo({
  className,
  size = 40,
  variant = "club",
}: {
  className?: string;
  size?: number;
  variant?: LogoVariant;
}) {
  const src = withBasePath(LOGO_SRC[variant]);
  const alt = variant === "coin" ? "LAE Coin" : "LAE Club";
  const isCoin = variant === "coin";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        isCoin
          ? "rounded-full border border-brand-500/20"
          : "rounded-xl border border-brand-500/20",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={cn(
          "h-full w-full object-cover",
          isCoin
            ? "drop-shadow-[0_0_24px_rgba(255,195,26,0.45)]"
            : "drop-shadow-[0_0_14px_rgba(255,195,26,0.35)]"
        )}
      />
    </span>
  );
}
