"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";

export function EcosystemOrbit() {
  const reduced = usePrefersReducedMotion();
  const cx = 160;
  const cy = 160;
  const radius = 90;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <svg viewBox="0 0 320 320" className="h-full w-full" aria-hidden>
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffc31a" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffc31a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={radius + 18} fill="url(#coreGlow)" />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,195,26,0.12)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        {!reduced && (
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(243,186,47,0.35)"
            strokeWidth="0.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}

        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - radius}
          stroke="rgba(243,186,47,0.25)"
          strokeWidth="1"
        />
        <circle
          cx={cx}
          cy={cy - radius}
          r="26"
          fill="#F3BA2F22"
          stroke="#F3BA2F88"
          strokeWidth="1"
        />
        <text
          x={cx}
          y={cy - radius + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e2e8f0"
          fontSize="12"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
        >
          BNB
        </text>

        <circle cx={cx} cy={cy} r="36" fill="rgba(255,195,26,0.15)" stroke="#ffc31a" strokeWidth="1.5" />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffc31a"
          fontSize="18"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          LAE
        </text>
      </svg>
    </div>
  );
}
