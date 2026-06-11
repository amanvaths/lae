"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/useDeferredReady";

const nodes = [
  { id: "you", label: "You", x: 50, y: 12, r: 14 },
  { id: "l1a", label: "L1", x: 22, y: 38, r: 10 },
  { id: "l1b", label: "L1", x: 50, y: 38, r: 10 },
  { id: "l1c", label: "L1", x: 78, y: 38, r: 10 },
  { id: "l2a", label: "L2", x: 12, y: 68, r: 8 },
  { id: "l2b", label: "L2", x: 32, y: 68, r: 8 },
  { id: "l2c", label: "L2", x: 50, y: 68, r: 8 },
  { id: "l2d", label: "L2", x: 68, y: 68, r: 8 },
  { id: "l2e", label: "L2", x: 88, y: 68, r: 8 },
];

const edges: [string, string][] = [
  ["l1a", "you"],
  ["l1b", "you"],
  ["l1c", "you"],
  ["l2a", "l1a"],
  ["l2b", "l1a"],
  ["l2c", "l1b"],
  ["l2d", "l1c"],
  ["l2e", "l1c"],
];

function nodeById(id: string) {
  return nodes.find((n) => n.id === id)!;
}

export function RewardFlowGraphic({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <svg
      viewBox="0 0 100 80"
      className={`w-full ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="flowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffc31a" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffc31a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ffd54f" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {edges.map(([from, to], i) => {
        const a = nodeById(from);
        const b = nodeById(to);
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(255,195,26,0.15)"
            strokeWidth="0.4"
            strokeDasharray="1.5 1"
          />
        );
      })}

      {!reduced &&
        edges.map(([from, to], i) => {
          const a = nodeById(from);
          const b = nodeById(to);
          return (
            <motion.circle
              key={`pulse-${from}-${to}`}
              r="0.8"
              fill="#ffc31a"
              filter="url(#glow)"
              initial={{ cx: a.x, cy: a.y, opacity: 0 }}
              animate={{
                cx: [a.x, b.x],
                cy: [a.y, b.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeInOut",
              }}
            />
          );
        })}

      {nodes.map((n) => (
        <g key={n.id}>
          <circle
            cx={n.x}
            cy={n.y}
            r={n.r}
            fill={n.id === "you" ? "rgba(255,195,26,0.25)" : "rgba(255,195,26,0.08)"}
            stroke={n.id === "you" ? "#ffc31a" : "rgba(255,195,26,0.35)"}
            strokeWidth="0.5"
          />
          <text
            x={n.x}
            y={n.y + 0.5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={n.id === "you" ? "#ffc31a" : "#94a3b8"}
            fontSize={n.id === "you" ? "4.5" : "3.5"}
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            {n.label}
          </text>
        </g>
      ))}

      {!reduced && (
        <motion.rect
          x="46"
          y="0"
          width="8"
          height="80"
          fill="url(#flowGrad)"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </svg>
  );
}
