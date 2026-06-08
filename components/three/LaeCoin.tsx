"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Environment, Float } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The LAE token rendered as a real 3D coin: a textured cylinder whose two
 * faces use /lae-coin.png with a milled gold edge. Drop the official artwork
 * at public/lae-coin.png (square, transparent outside the circle) to swap it.
 */
function Coin({ radius = 2, thickness = 0.26 }: { radius?: number; thickness?: number }) {
  const spin = useRef<THREE.Group>(null);

  const tex = useTexture("/lae-coin.png");
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.center.set(0.5, 0.5);
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
          <cylinderGeometry args={[radius, radius, thickness, 96]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius - 0.01, 0.03, 16, 96]} />
          <meshStandardMaterial color="#ffe9a8" metalness={1} roughness={0.2} />
        </mesh>
      </Float>
    </group>
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
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 6.4], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 5]} intensity={2.6} color="#fff4d6" />
        <directionalLight position={[-5, -2, 2]} intensity={1.2} color="#8b5cf6" />
        <pointLight position={[0, 0, 5]} intensity={1.6} color="#ffd86b" />
        <Coin radius={radius} thickness={thickness} />
        <Environment preset="sunset" environmentIntensity={0.85} />
      </Suspense>
    </Canvas>
  );
}
