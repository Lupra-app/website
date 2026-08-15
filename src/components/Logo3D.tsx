"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";

function LogoMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // Continuous rotation with GSAP
    gsap.to(groupRef.current.rotation, {
      z: Math.PI * 2,
      duration: 8,
      repeat: -1,
      ease: "none",
    });
  }, []);

  // Optional: slight orbit with mouse
  useFrame(({ mouse }) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = mouse.y * 0.1;
      groupRef.current.rotation.y = mouse.x * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ring (Halka) - with gap at top-right (90°-180°) */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[2, 0.15, 32, 256, Math.PI * 1.5, Math.PI * 1.5]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={0.5}
          wireframe={false}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Dot (Nokta) - at top-right */}
      <mesh ref={dotRef} position={[Math.sqrt(2), Math.sqrt(2), 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#4f46e5"
          emissive="#4f46e5"
          emissiveIntensity={0.8}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>

      {/* Subtle glow effect using additional torus */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[2, 0.15, 32, 256, Math.PI * 1.5, Math.PI * 1.5]} />
        <meshBasicMaterial
          color="#818cf8"
          wireframe={true}
          transparent={true}
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

interface Logo3DProps {
  className?: string;
  size?: number;
}

export function Logo3D({ className = "", size = 400 }: Logo3DProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 75 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, 10]} intensity={0.4} />
        <LogoMesh />
        <OrbitControls
          autoRotate={false}
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}
