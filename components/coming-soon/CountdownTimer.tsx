"use client";

import { useEffect, useState } from "react";
import { LAUNCH_AT } from "@/lib/site-gate";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function calcLeft(): TimeLeft {
  const diff = Math.max(0, LAUNCH_AT - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff === 0,
  };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 sm:gap-2">
      <div className="relative w-full overflow-hidden border border-brand-500/25 bg-ink-900/80 px-1.5 py-3 backdrop-blur-sm min-[380px]:px-2 sm:px-3 sm:py-4 md:py-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
        <span className="block font-display text-2xl font-bold tabular-nums leading-none text-white min-[380px]:text-3xl sm:text-4xl md:text-5xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-slate-500 min-[380px]:text-[0.6rem] sm:text-xs sm:tracking-[0.2em]">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setLeft(calcLeft());
    const id = setInterval(() => setLeft(calcLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!left) {
    return (
      <div className="grid grid-cols-4 gap-2 min-[380px]:gap-2.5 sm:gap-3 md:gap-4">
        {["Days", "Hours", "Mins", "Secs"].map((label) => (
          <Unit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  if (left.done) {
    return (
      <p className="px-2 font-display text-xl font-bold text-shimmer min-[380px]:text-2xl sm:text-3xl">
        We&apos;re live — welcome to LAE
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 min-[380px]:gap-2.5 sm:gap-3 md:gap-4">
      <Unit value={left.days} label="Days" />
      <Unit value={left.hours} label="Hours" />
      <Unit value={left.minutes} label="Mins" />
      <Unit value={left.seconds} label="Secs" />
    </div>
  );
}
