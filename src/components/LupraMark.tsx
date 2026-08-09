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
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dotMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const dotMeshRef = useRef<THREE.Mesh>(null);

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
    if (ringMatRef.current) ringMatRef.current.opacity = t.opacity;
    if (dotMatRef.current) dotMatRef.current.opacity = t.opacity;
    if (dotMeshRef.current) dotMeshRef.current.scale.setScalar(t.dotPulse);

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
          <mesh>
            <torusGeometry
              args={[
                RING_RADIUS,
                RING_TUBE,
                24,
                100,
                THREE.MathUtils.degToRad(RING_SWEEP_DEG),
              ]}
              onUpdate={(geo) => geo.rotateZ(THREE.MathUtils.degToRad(RING_ROTATE_DEG))}
            />
            <meshStandardMaterial
              ref={ringMatRef}
              color="#101828"
              roughness={0.9}
              metalness={0}
              transparent
              opacity={1}
            />
          </mesh>

          {/* Rounded caps at the open ends of the arc, echoing the brand mark's round linecap. */}
          <mesh position={capA}>
            <sphereGeometry args={[RING_TUBE, 20, 20]} />
            <meshStandardMaterial color="#101828" roughness={0.9} metalness={0} />
          </mesh>
          <mesh position={capB}>
            <sphereGeometry args={[RING_TUBE, 20, 20]} />
            <meshStandardMaterial color="#101828" roughness={0.9} metalness={0} />
          </mesh>

          <mesh ref={dotMeshRef} position={dotPos}>
            <sphereGeometry args={[RING_TUBE * 1.6, 24, 24]} />
            <meshStandardMaterial
              ref={dotMatRef}
              color="#4F46E5"
              roughness={0.55}
              metalness={0}
              transparent
              opacity={1}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
