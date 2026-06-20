"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Float } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { withBasePath } from "@/lib/paths";
import { CoinFallback } from "@/components/three/CoinFallback";
import { WebGLErrorBoundary } from "@/components/three/WebGLErrorBoundary";
import { useDeferredReady, useIsMobile, usePrefersReducedMotion } from "@/lib/useDeferredReady";

function supportsWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

function Coin({
  radius = 2,
  thickness = 0.26,
}: {
  radius?: number;
  thickness?: number;
}) {
  const spin = useRef<THREE.Group>(null);

  const tex = useTexture(withBasePath("/lae-coin-logo.png"));
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    tex.center.set(0.5, 0.5);
    // Face UV maps sideways on the cylinder cap — rotate so "LAE" reads upright.
    tex.rotation = Math.PI / 2;
  }, [tex]);

  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8af45",
        metalness: 1,
        roughness: 0.32,
        emissive: new THREE.Color("#3a2a08"),
        emissiveIntensity: 0.35,
      }),
    []
  );

  const faceMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        metalness: 0.55,
        roughness: 0.4,
        transparent: true,
        emissive: new THREE.Color("#1a1305"),
        emissiveIntensity: 0.25,
      }),
    [tex]
  );

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.55;
  });

  return (
    <group ref={spin} rotation={[0.12, 0, 0]}>
      <Float speed={1.3} rotationIntensity={0.15} floatIntensity={0.8}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={[edgeMat, faceMat, faceMat]}>
          <cylinderGeometry args={[radius, radius, thickness, 32]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius - 0.01, 0.03, 8, 32]} />
          <meshStandardMaterial color="#ffe9a8" metalness={1} roughness={0.2} />
        </mesh>
      </Float>
    </group>
  );
}

function LaeCoinCanvas({
  radius = 2,
  thickness = 0.26,
  className,
  onFail,
}: {
  radius?: number;
  thickness?: number;
  className?: string;
  onFail: () => void;
}) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 6.4], fov: 40 }}
      dpr={[1, 1]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener(
          "webglcontextlost",
          (event) => {
            event.preventDefault();
            onFail();
          },
          { once: true }
        );
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[4, 5, 5]} intensity={2.4} color="#fff4d6" />
        <directionalLight position={[-5, -2, 2]} intensity={1.1} color="#8b5cf6" />
        <pointLight position={[0, 0, 5]} intensity={1.4} color="#ffd86b" />
        <Coin radius={radius} thickness={thickness} />
      </Suspense>
    </Canvas>
  );
}

export default function LaeCoin({
  radius = 2,
  thickness = 0.26,
  className,
}: {
  radius?: number;
  thickness?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const deferred = useDeferredReady(1800);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    setCanRender(supportsWebGL());
  }, []);

  const fallback = <CoinFallback className={className} spin={false} />;

  if (failed || !canRender || mobile || reduced || !deferred) return fallback;

  return (
    <WebGLErrorBoundary
      fallback={fallback}
      onError={() => setFailed(true)}
    >
      <LaeCoinCanvas
        radius={radius}
        thickness={thickness}
        className={className}
        onFail={() => setFailed(true)}
      />
    </WebGLErrorBoundary>
  );
}
