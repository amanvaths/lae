"use client";

import { useEffect, useRef } from "react";
import { useInViewPause } from "@/lib/useInViewPause";
import { usePrefersReducedMotion, useIsMobile } from "@/lib/useDeferredReady";

export function NetworkCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ref: wrapRef, active } = useInViewPause<HTMLDivElement>("100px");
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || reduced || mobile || !active) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let particles: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    let w = 0;
    let h = 0;
    let raf = 0;
    const COUNT = Math.min(32, Math.floor(window.innerWidth / 28));

    const resize = () => {
      w = canvas.width = wrap.offsetWidth;
      h = canvas.height = wrap.offsetHeight;
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.4 + 0.5,
      }));
    };

    const frame = () => {
      if (!active || document.hidden) {
        raf = requestAnimationFrame(frame);
        return;
      }

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = i % 5 === 0 ? "rgba(255,195,26,0.5)" : "rgba(255,195,26,0.18)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 8100) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(255,195,26,${0.1 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    frame();
    window.addEventListener("resize", resize, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active, reduced, mobile, wrapRef]);

  if (reduced || mobile) return null;

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-50" />
    </div>
  );
}
