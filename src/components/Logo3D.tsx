"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prefersReducedMotion } from "@/lib/gsap";
import {
  CAMERA_FOV,
  CAMERA_DISTANCE,
  vhToScale,
  createSceneTarget,
  type SceneTarget,
} from "@/lib/scene3d";
import { LupraMark } from "./LupraMark";
import { StudioLighting } from "./Scene3D";

// Same resting pose as the landing page mark (see Scene3D.tsx) so the admin
// background reads as the same object, just parked and slowly turning.
const BASE_TILT_X = THREE.MathUtils.degToRad(-27);
const BASE_TILT_Y = THREE.MathUtils.degToRad(22);
// Slightly faster than the landing page's idle spin (0.08), but still slow —
// it's a background texture behind the glass panels, not a focal point.
const SPIN_RAD_PER_SEC = 0.1;
/** Mark diameter as a fraction of the canvas, in "vh" of the canvas height. */
const MARK_SIZE_VH = 80;

function SpinningMark({ animate }: { animate: boolean }) {
  const target = useRef<SceneTarget>(
    createSceneTarget({
      scale: vhToScale(MARK_SIZE_VH),
      tiltX: BASE_TILT_X,
      tiltY: BASE_TILT_Y,
    })
  );

  useFrame((_, delta) => {
    if (!animate) return;
    target.current.spin += Math.min(delta, 0.1) * SPIN_RAD_PER_SEC;
  });

  return <LupraMark target={target} layer="full" />;
}

interface Logo3DProps {
  className?: string;
  size?: number;
}

/**
 * The Lupra mark — identical geometry, materials, and lighting to the landing
 * page hero — rendered standalone in one square canvas, spinning in place.
 * Used as the admin panel's background behind the glass panels.
 */
export function Logo3D({ className = "", size = 800 }: Logo3DProps) {
  const animate = typeof window === "undefined" ? true : !prefersReducedMotion();
  const dimension = `min(${size}px, 92vmin)`;

  return (
    <div className={className} style={{ width: dimension, height: dimension }}>
      <Canvas
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE], near: 0.1, far: 100 }}
        frameloop={animate ? "always" : "demand"}
        style={{ background: "transparent", display: "block", width: "100%", height: "100%" }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[-2.5, 2.5, 3]} intensity={0.9} />
        <directionalLight position={[2.5, -1.5, 2]} intensity={0.4} />
        <StudioLighting />
        <SpinningMark animate={animate} />
      </Canvas>
    </div>
  );
}
