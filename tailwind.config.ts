import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0a",
          900: "#191919",
          800: "#222222",
          700: "#2a2a2a",
        },
        brand: {
          50: "#fffbeb",
          100: "#fff3c4",
          200: "#ffe082",
          300: "#ffd54f",
          400: "#ffca28",
          500: "#ffc31a",
          600: "#e5a800",
          700: "#c89200",
          800: "#a67c00",
          900: "#7a5a00",
        },
        accent: {
          400: "#ffd86b",
          500: "#ffc31a",
          600: "#e5a820",
        },
        gold: {
          300: "#ffe082",
          400: "#ffd54f",
          500: "#ffc31a",
          600: "#e5a800",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(255,195,26,0.45)",
        "glow-gold": "0 0 60px -10px rgba(255,195,26,0.35)",
        "inner-line": "inset 0 1px 0 0 rgba(255,255,255,0.06)",
        // Premium elevation scale for cards / panels / popovers
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.7)",
        "card-hover":
          "0 1px 0 0 rgba(212,175,55,0.10) inset, 0 12px 36px -14px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.10)",
        elevated:
          "0 1px 0 0 rgba(255,255,255,0.05) inset, 0 24px 60px -22px rgba(0,0,0,0.85)",
        popover:
          "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 16px 48px -16px rgba(0,0,0,0.9)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        "radial-fade":
          "radial-gradient(60% 60% at 50% 0%, rgba(255,195,26,0.1) 0%, rgba(10,10,10,0) 70%)",
        "grid-lines":
          "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
        "cryptro-stats":
          "linear-gradient(135deg, #1a1408 0%, #0a0a0a 50%, #191919 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "shimmer-slide": {
          "100%": { transform: "translateX(100%)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "bob-scroll": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(8px)", opacity: "1" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        orbit: {
          to: { transform: "rotate(360deg)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "skeleton-shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "shimmer-slide": "shimmer-slide 2.5s infinite",
        "spin-slow": "spin-slow 22s linear infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        marquee: "marquee 28s linear infinite",
        "bob-scroll": "bob-scroll 2.5s ease-in-out infinite",
        shimmer: "shimmer 4s linear infinite",
        scanline: "scanline 8s linear infinite",
        orbit: "orbit 30s linear infinite",
        "fade-in": "fade-in 0.5s ease-premium both",
        "fade-up": "fade-up 0.5s ease-premium both",
        "scale-in": "scale-in 0.35s ease-premium both",
        "skeleton-shimmer": "skeleton-shimmer 1.6s ease-premium infinite",
      },
    },
  },
  plugins: [],
};

export default config;
