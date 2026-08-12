"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  RING_RADIUS,
  RING_TUBE,
  RING_SWEEP_DEG,
  RING_ROTATE_DEG,
  RING_DOT_ANGLE_DEG,
  type SceneTarget,
} from "@/lib/scene3d";

const IDLE_SPIN_RAD_PER_SEC = 0.1;
const MAX_TILT_RAD = THREE.MathUtils.degToRad(6);
const TILT_LERP_SPEED = 3.5;
// Fixed viewing angle so the ring reads as a 3D form (not a flat 2D circle).
// This must stay CONSTANT, not accumulate — spinning around an in-plane axis
// (X or Y) would carry the ring edge-on to the camera once per rotation,
// collapsing it into an illegible sliver. The idle spin instead turns around
// the ring's own perpendicular (Z) axis, which keeps the silhouette constant
// and only orbits the gap/dot around it — always legible.
const BASE_TILT_X = THREE.MathUtils.degToRad(-27);

export function LupraMark({
  target,
  animated,
}: {
  target: RefObject<SceneTarget>;
  animated: boolean;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const scrollGroupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const dotGroupRef = useRef<THREE.Group>(null);

  // Shared across the torus + both end caps so they read as one continuous
  // material (matches the brand mark's single-stroke silhouette), and gives
  // the polished, faintly clearcoated "soft ceramic" look instead of the
  // flat, chalky matte of a plain roughness-0.9 standard material.
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#101828",
        roughness: 0.42,
        metalness: 0.15,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.1,
        transparent: true,
        opacity: 1,
      }),
    []
  );
  const dotMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#4F46E5",
        roughness: 0.16,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.6,
        emissive: new THREE.Color("#4338CA"),
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 1,
      }),
    []
  );
  // Cheap fake bloom: an oversized, unlit, additively-blended shell behind the
  // dot. Reads as a soft glow at a fraction of the GPU cost of a real
  // postprocessing bloom pass — worth it since this canvas renders full-screen
  // for the entire scroll journey, including on mobile.
  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#818CF8",
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  useEffect(() => {
    return () => {
      ringMaterial.dispose();
      dotMaterial.dispose();
      glowMaterial.dispose();
    };
  }, [ringMaterial, dotMaterial, glowMaterial]);

  const { dotPos, capA, capB } = useMemo(() => {
    const dotAngle = THREE.MathUtils.degToRad(RING_DOT_ANGLE_DEG);
    const sweepRad = THREE.MathUtils.degToRad(RING_SWEEP_DEG);
    const rotRad = THREE.MathUtils.degToRad(RING_ROTATE_DEG);
    return {
      dotPos: new THREE.Vector3(
        RING_RADIUS * Math.cos(dotAngle),
        RING_RADIUS * Math.sin(dotAngle),
        0
      ),
      capA: new THREE.Vector3(RING_RADIUS * Math.cos(rotRad), RING_RADIUS * Math.sin(rotRad), 0),
      capB: new THREE.Vector3(
        RING_RADIUS * Math.cos(rotRad + sweepRad),
        RING_RADIUS * Math.sin(rotRad + sweepRad),
        0
      ),
    };
  }, []);

  useEffect(() => {
    if (!animated) return;
    const onPointerMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [animated]);

  useFrame((_state, delta) => {
    const t = target.current;
    if (scrollGroupRef.current) {
      scrollGroupRef.current.position.set(t.x, t.y, t.z);
      scrollGroupRef.current.scale.setScalar(t.scale);
    }
    ringMaterial.opacity = t.opacity;
    dotMaterial.opacity = t.opacity;
    glowMaterial.opacity = 0.35 * t.opacity;
    if (dotGroupRef.current) dotGroupRef.current.scale.setScalar(t.dotPulse);

    if (!animated) return;

    if (spinGroupRef.current) {
      spinGroupRef.current.rotation.z += IDLE_SPIN_RAD_PER_SEC * delta;
    }
    if (tiltGroupRef.current) {
      const p = pointer.current;
      const targetTiltX = BASE_TILT_X + p.y * -MAX_TILT_RAD;
      const targetTiltY = p.x * MAX_TILT_RAD;
      tiltGroupRef.current.rotation.x = THREE.MathUtils.damp(
        tiltGroupRef.current.rotation.x,
        targetTiltX,
        TILT_LERP_SPEED,
        delta
      );
      tiltGroupRef.current.rotation.y = THREE.MathUtils.damp(
        tiltGroupRef.current.rotation.y,
        targetTiltY,
        TILT_LERP_SPEED,
        delta
      );
    }
  });

  return (
    <group ref={scrollGroupRef}>
      <group ref={tiltGroupRef} rotation={[BASE_TILT_X, 0, 0]}>
        <group ref={spinGroupRef}>
          <mesh material={ringMaterial}>
            <torusGeometry
              args={[
                RING_RADIUS,
                RING_TUBE,
                32,
                160,
                THREE.MathUtils.degToRad(RING_SWEEP_DEG),
              ]}
              onUpdate={(geo) => geo.rotateZ(THREE.MathUtils.degToRad(RING_ROTATE_DEG))}
            />
          </mesh>

          {/* Rounded caps at the open ends of the arc, echoing the brand mark's round linecap. */}
          <mesh position={capA} material={ringMaterial}>
            <sphereGeometry args={[RING_TUBE, 32, 32]} />
          </mesh>
          <mesh position={capB} material={ringMaterial}>
            <sphereGeometry args={[RING_TUBE, 32, 32]} />
          </mesh>

          <group ref={dotGroupRef} position={dotPos}>
            <mesh material={dotMaterial}>
              <sphereGeometry args={[RING_TUBE * 1.6, 32, 32]} />
            </mesh>
            <mesh material={glowMaterial}>
              <sphereGeometry args={[RING_TUBE * 1.6 * 2.4, 16, 16]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
