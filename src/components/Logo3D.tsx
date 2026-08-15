"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/gsap";

// Geometry mirrors the SVG mark in Logo.tsx: a ring with a 70° gap centered at
// the top-right (45°) and the dot sitting on the ring radius inside that gap.
const RING_RADIUS = 2.5;
const RING_TUBE = 0.4; // strokeWidth 7 / ring radius 22, scaled
const RING_ARC = (290 / 180) * Math.PI;
const RING_ROTATION_Z = (80 / 180) * Math.PI; // shifts the gap to top-right
const DOT_RADIUS = 0.62; // dot r 5.5 / ring radius 22, scaled
const DOT_POS = RING_RADIUS * Math.SQRT1_2;

function LogoMesh({ animate }: { animate: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!animate || !groupRef.current) return;
    const group = groupRef.current;
    group.rotation.y += delta * 0.35;
    group.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.3;
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[0, 0, RING_ROTATION_Z]}>
        <torusGeometry args={[RING_RADIUS, RING_TUBE, 48, 200, RING_ARC]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.5}
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>

      <mesh position={[DOT_POS, DOT_POS, 0]}>
        <sphereGeometry args={[DOT_RADIUS, 32, 32]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#818cf8"
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

interface Logo3DProps {
  className?: string;
  size?: number;
}

export function Logo3D({ className = "", size = 800 }: Logo3DProps) {
  const animate = typeof window === "undefined" ? true : !prefersReducedMotion();

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        frameloop={animate ? "always" : "demand"}
        style={{ background: "transparent", display: "block", width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#818cf8" />
        <pointLight position={[-10, -10, 8]} intensity={0.6} color="#4f46e5" />
        <LogoMesh animate={animate} />
      </Canvas>
    </div>
  );
}
