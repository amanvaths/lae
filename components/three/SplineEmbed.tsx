"use client";

import { useEffect, useRef, useState } from "react";

function Fallback({ pulse }: { pulse?: boolean }) {
  return (
    <div className="grid h-full w-full place-items-center">
      <div
        className={`h-56 w-56 rounded-full bg-gradient-to-tr from-brand-500/40 to-accent-500/40 blur-2xl ${
          pulse ? "animate-pulse-glow" : "animate-float"
        }`}
      />
    </div>
  );
}

/**
 * Optional Spline 3D embed using the official @splinetool/runtime on a canvas.
 * Fully client-side. Falls back to an animated gradient orb if the scene fails
 * to load (offline / dead URL), so the section never looks broken.
 */
export function SplineEmbed({
  scene = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode",
}: {
  scene?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let app: { dispose: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Application } = await import("@splinetool/runtime");
        if (cancelled || !canvasRef.current) return;
        const instance = new Application(canvasRef.current);
        await instance.load(scene);
        if (cancelled) {
          instance.dispose();
          return;
        }
        app = instance;
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      app?.dispose();
    };
  }, [scene]);

  if (status === "error") return <Fallback />;

  return (
    <div className="relative h-full w-full">
      {status === "loading" && (
        <div className="absolute inset-0">
          <Fallback pulse />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ opacity: status === "ready" ? 1 : 0, transition: "opacity .6s" }}
      />
    </div>
  );
}
