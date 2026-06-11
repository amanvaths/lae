"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";

const orbitNodes = [
  { label: "ETH", angle: 0, color: "#627EEA" },
  { label: "BNB", angle: 72, color: "#F3BA2F" },
  { label: "MATIC", angle: 144, color: "#8247E5" },
  { label: "ARB", angle: 216, color: "#28A0F0" },
  { label: "LINK", angle: 288, color: "#375BD2" },
];

export function EcosystemOrbit() {
  const reduced = usePrefersReducedMotion();
  const cx = 160;
  const cy = 160;
  const radius = 105;

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
            stroke="rgba(255,195,26,0.25)"
            strokeWidth="0.5"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        )}

        {orbitNodes.map((n) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = cx + radius * Math.cos(rad);
          const y = cy + radius * Math.sin(rad);
          return (
            <g key={n.label}>
              <line
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="rgba(255,195,26,0.1)"
                strokeWidth="1"
              />
              <circle cx={x} cy={y} r="22" fill={`${n.color}22`} stroke={`${n.color}88`} strokeWidth="1" />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#e2e8f0"
                fontSize="11"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
              >
                {n.label}
              </text>
            </g>
          );
        })}

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
