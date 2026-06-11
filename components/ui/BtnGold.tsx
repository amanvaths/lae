"use client";

import { useRef, type ComponentProps, type MouseEvent } from "react";

type BtnGoldProps = ComponentProps<"a">;

export function BtnGold({ className, children, ...props }: BtnGoldProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--bx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--by", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <a
      ref={ref}
      className={className ?? "btn-gold"}
      onMouseMove={onMove}
      {...props}
    >
      {children}
    </a>
  );
}
