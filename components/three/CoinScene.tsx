"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Edges, RoundedBox, Line } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/* ============================================================
   Blockchain cube — a 3×3×3 lattice of "blocks" forming a cube,
   with crisp edges, an orbiting chain of blocks, and a wireframe
   shell. No bloom / no atmosphere glow — clean and sharp.
   ============================================================ */

function BlockCube() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.28;
      group.current.rotation.x += delta * 0.07;
    }
  });

  const blocks = useMemo(() => {
    const arr: { pos: [number, number, number]; accent: boolean }[] = [];
    const n = 3;
    const gap = 0.64;
    for (let x = 0; x < n; x++)
      for (let y = 0; y < n; y++)
        for (let z = 0; z < n; z++) {
          if (x === 1 && y === 1 && z === 1) continue; // hollow center
          arr.push({
            pos: [(x - 1) * gap, (y - 1) * gap, (z - 1) * gap],
            accent: (x + y + z) % 4 === 0,
          });
        }
    return arr;
  }, []);

  return (
    <group ref={group} scale={1.15}>
      {blocks.map((b, i) => (
        <RoundedBox
          key={i}
          args={[0.5, 0.5, 0.5]}
          radius={0.06}
          smoothness={3}
          position={b.pos}
        >
          <meshStandardMaterial
            color={b.accent ? "#1a376a" : "#0d1e3b"}
            metalness={0.78}
            roughness={0.32}
          />
          <Edges threshold={15} color={b.accent ? "#8b5cf6" : "#3aa0ff"} />
        </RoundedBox>
      ))}

      {/* wireframe shell that binds the cube together */}
      <mesh>
        <boxGeometry args={[2.1, 2.1, 2.1]} />
        <meshBasicMaterial color="#4aa6ff" wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

/* ---------- orbiting "chain" of blocks ---------- */
function ChainOrbit() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  const { nodes, ring } = useMemo(() => {
    const count = 8;
    const r = 2.9;
    const nodes: { pos: [number, number, number]; accent: boolean }[] = [];
    const ring: [number, number, number][] = [];
    for (let i = 0; i <= count; i++) {
      const a = (i / count) * Math.PI * 2;
      const p: [number, number, number] = [
        Math.cos(a) * r,
        Math.sin(a * 2) * 0.35,
        Math.sin(a) * r,
      ];
      ring.push(p);
      if (i < count) nodes.push({ pos: p, accent: i % 2 === 0 });
    }
    return { nodes, ring };
  }, []);

  return (
    <group ref={group} rotation={[0.5, 0, 0.15]}>
      <Line points={ring} color="#2b6fd6" lineWidth={1} transparent opacity={0.5} />
      {nodes.map((n, i) => (
        <RoundedBox
          key={i}
          args={[0.22, 0.22, 0.22]}
          radius={0.04}
          smoothness={2}
          position={n.pos}
        >
          <meshStandardMaterial
            color={n.accent ? "#2a4d8a" : "#13294d"}
            metalness={0.8}
            roughness={0.3}
          />
          <Edges threshold={15} color={n.accent ? "#a78bfa" : "#58b0ff"} />
        </RoundedBox>
      ))}
    </group>
  );
}

/* ---------- faint static star dust (no glow) ---------- */
function Dust({ count = 90 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#7fb0e6"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Default export kept as `CoinScene` so the existing Hero import keeps working,
 * but it now renders the blockchain cube (no glow) per the design direction.
 */
export default function CoinScene({ className }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0.4, 6.2], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        {/* lighting only — no bloom, no glow */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 6, 5]} intensity={2.6} color="#ffffff" />
        <directionalLight position={[-5, -2, -4]} intensity={1.3} color="#6aa9ff" />
        <pointLight position={[3, -3, 4]} intensity={1.6} color="#8b5cf6" />

        <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.6}>
          <BlockCube />
          <ChainOrbit />
        </Float>
        <Dust />
      </Suspense>
    </Canvas>
  );
}
