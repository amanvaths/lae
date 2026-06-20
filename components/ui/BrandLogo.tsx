import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export type LogoVariant = "club" | "coin";

export function BrandLogo({
  className,
  size = 40,
  variant = "club",
}: {
  className?: string;
  size?: number;
  variant?: LogoVariant;
}) {
  const src =
    variant === "coin"
      ? withBasePath("/lae-coin-logo.png")
      : withBasePath("/lae-club-logo.png");
  const alt = variant === "coin" ? "LAE Coin" : "LAE Club";

  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden",
        variant === "club" ? "rounded-lg" : "rounded-full",
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
        className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(255,195,26,0.35)]"
      />
    </span>
  );
}
