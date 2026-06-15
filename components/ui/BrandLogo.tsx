import { withBasePath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("relative shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={withBasePath("/lae-coin.png")}
        alt="LAE"
        width={size}
        height={size}
        className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(255,195,26,0.5)]"
      />
    </span>
  );
}
