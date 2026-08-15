"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

function LogoMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Smooth continuous 3D rotation
    gsap.to(groupRef.current.rotation, {
      x: Math.PI * 2,
      y: Math.PI * 2,
      z: Math.PI * 0.5,
      duration: 15,
      repeat: -1,
      ease: "none",
    });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Main Ring (Halka) - with gap at top-right */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[2.5, 0.2, 32, 256, Math.PI * 1.5, Math.PI * 1.5]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.6}
          wireframe={false}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Dot (Nokta) - at top-right position */}
      <mesh ref={dotRef} position={[Math.sqrt(2) * 2.5, Math.sqrt(2) * 2.5, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color="#4f46e5"
          emissive="#818cf8"
          emissiveIntensity={1.0}
          metalness={0.7}
          roughness={0.15}
        />
      </mesh>

      {/* Glow wireframe ring */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2.5, 0.2, 32, 256, Math.PI * 1.5, Math.PI * 1.5]} />
        <meshBasicMaterial
          color="#818cf8"
          wireframe={true}
          transparent={true}
          opacity={0.3}
        />
      </mesh>

      {/* Extra glow sphere for depth */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[3, 16, 16]} />
        <meshBasicMaterial
          color="#4f46e5"
          wireframe={true}
          transparent={true}
          opacity={0.1}
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
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        style={{
          background: "transparent",
          display: "block",
          width: "100%",
          height: "100%",
        }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[15, 15, 15]} intensity={1.0} color="#818cf8" />
        <pointLight position={[-15, -15, 15]} intensity={0.6} color="#4f46e5" />
        <pointLight position={[0, 0, 20]} intensity={0.4} />
        <LogoMesh />
      </Canvas>
    </div>
  );
}
