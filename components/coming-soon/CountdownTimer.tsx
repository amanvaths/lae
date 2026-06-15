"use client";

import { useEffect, useState } from "react";

const LAUNCH_AT = new Date("2026-06-22T00:00:00").getTime();

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
    <div className="flex min-w-[4.5rem] flex-col items-center gap-2 sm:min-w-[5.5rem]">
      <div className="relative w-full overflow-hidden border border-brand-500/25 bg-ink-900/80 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />
        <span className="font-display text-3xl font-bold tabular-nums text-white sm:text-4xl md:text-5xl">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
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
      <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {["Days", "Hours", "Mins", "Secs"].map((label) => (
          <Unit key={label} value={0} label={label} />
        ))}
      </div>
    );
  }

  if (left.done) {
    return (
      <p className="font-display text-2xl font-bold text-shimmer sm:text-3xl">
        We&apos;re live — welcome to LAE
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-5">
      <Unit value={left.days} label="Days" />
      <Unit value={left.hours} label="Hours" />
      <Unit value={left.minutes} label="Mins" />
      <Unit value={left.seconds} label="Secs" />
    </div>
  );
}
