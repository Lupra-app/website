"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
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
//
// This ONLY holds if tilt is applied before spin in the transform chain
// (tiltGroup nested inside spinGroup, so tilt is closer to the mesh). Tilt
// (X) and spin (Z) don't commute: spin-then-tilt — the previous
// nesting — bakes the fixed tilt onto whatever orientation the spin already
// produced, so the apparent foreshortening of the gap/dot changes over the
// rotation instead of staying put, and the dot visibly drifts out of the
// gap over a cycle. Tilt-then-spin fixes the shape once and rotates that
// fixed shape rigidly around the camera-facing axis, so the dot's position
// within the gap reads the same at every point in the spin.
const BASE_TILT_X = THREE.MathUtils.degToRad(-27);

// Shared prop values for the torus + both end caps so they read as one
// continuous material (matches the brand mark's single-stroke silhouette).
// Each <meshPhysicalMaterial> below still gets its own instance — R3F has no
// cross-element material sharing — this constant just keeps the tuning in
// one place. Clearcoat + moderate roughness gives the polished "soft
// ceramic" look instead of the flat, chalky matte of the old roughness-0.9
// standard material.
const RING_MATERIAL_PROPS = {
  color: "#101828",
  roughness: 0.42,
  metalness: 0.15,
  clearcoat: 0.6,
  clearcoatRoughness: 0.3,
  envMapIntensity: 1.1,
} as const;

// Radial falloff for the dot's fake-glow billboard, computed per-pixel in the
// fragment shader rather than baked into a flat sphere — a solid mesh has no
// way to fade from bright center to transparent edge, so it just reads as a
// hard-edged disc instead of a soft halo. Cheap fake bloom like this costs a
// fraction of a real postprocessing bloom pass — worth it since this canvas
// renders full-screen for the entire scroll journey, including on mobile.
const GLOW_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const GLOW_FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float falloff = pow(smoothstep(0.5, 0.0, d), 1.8);
    gl_FragColor = vec4(uColor, falloff * uOpacity);
  }
`;
const GLOW_SIZE = RING_TUBE * 1.6 * 5;
const GLOW_BASE_OPACITY = 0.6;

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

  // Materials are genuinely mutable (opacity/uniforms get written every
  // frame below), so — like the group refs above — they're declared in JSX
  // and only ever touched via .current inside useFrame/useEffect, never read
  // during render. Reading a ref's value during render, or mutating a value
  // returned from useMemo, both trip this project's hooks linter, which
  // treats render as required to stay pure.
  const ringMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const capAMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const capBMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const dotMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial>(null);
  const debugOnceRef = useRef(false);

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

  useFrame((state, delta) => {
    const t = target.current;
    if (!debugOnceRef.current && tiltGroupRef.current) {
      debugOnceRef.current = true;
      const W = state.size.width;
      const H = state.size.height;
      const px = (angDeg: number) => {
        const r = THREE.MathUtils.degToRad(angDeg);
        const v = new THREE.Vector3(RING_RADIUS * Math.cos(r), RING_RADIUS * Math.sin(r), 0);
        v.applyMatrix4(tiltGroupRef.current!.matrixWorld);
        v.project(state.camera);
        return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
      };
      // Projected arc length along the centerline between two gap angles.
      const arcLen = (a0: number, a1: number) => {
        let sum = 0;
        let prev = px(a0);
        for (let a = a0 + 0.25; a <= a1 + 1e-6; a += 0.25) {
          const cur = px(a);
          sum += Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
          prev = cur;
        }
        return sum;
      };
      const capBulge = THREE.MathUtils.radToDeg(Math.asin(RING_TUBE / RING_RADIUS));
      const ballHalf = THREE.MathUtils.radToDeg(Math.asin((RING_TUBE * 1.6) / RING_RADIUS));
      const gapLo = 360 + RING_ROTATE_DEG - 360 - (360 - RING_SWEEP_DEG) + (360 - RING_SWEEP_DEG); // noop guard
      void gapLo;
      const lo = RING_ROTATE_DEG - (360 - RING_SWEEP_DEG) + capBulge; // 10 + bulge
      const hi = RING_ROTATE_DEG - capBulge; // 80 - bulge
      let best = 45;
      let bestDiff = Infinity;
      const results: [number, number, number][] = [];
      for (let a = lo + ballHalf; a <= hi - ballHalf; a += 0.25) {
        const left = arcLen(lo, a - ballHalf);
        const right = arcLen(a + ballHalf, hi);
        results.push([a, left, right]);
        if (Math.abs(left - right) < bestDiff) {
          bestDiff = Math.abs(left - right);
          best = a;
        }
      }
      const cur = results.reduce((p, c) =>
        Math.abs(c[0] - RING_DOT_ANGLE_DEG) < Math.abs(p[0] - RING_DOT_ANGLE_DEG) ? c : p
      );
      // eslint-disable-next-line no-console
      console.log(
        "DEBUG_ARC",
        JSON.stringify({ best, current: RING_DOT_ANGLE_DEG, currentSides: [cur[1], cur[2]] })
      );
    }
    if (scrollGroupRef.current) {
      scrollGroupRef.current.position.set(t.x, t.y, t.z);
      scrollGroupRef.current.scale.setScalar(t.scale);
    }
    if (ringMatRef.current) ringMatRef.current.opacity = t.opacity;
    if (capAMatRef.current) capAMatRef.current.opacity = t.opacity;
    if (capBMatRef.current) capBMatRef.current.opacity = t.opacity;
    if (dotMatRef.current) dotMatRef.current.opacity = t.opacity;
    if (glowMatRef.current) {
      glowMatRef.current.uniforms.uOpacity.value = GLOW_BASE_OPACITY * t.opacity;
    }
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
      <group ref={spinGroupRef}>
        <group ref={tiltGroupRef} rotation={[BASE_TILT_X, 0, 0]}>
          {/* The arc's angular placement is the mesh's own rotation, NOT a
              geo.rotateZ() in onUpdate: onUpdate re-fires on re-renders and
              HMR patches, and mutating the geometry there accumulates the
              rotation each time — the arc slowly walks around the ring in a
              long-lived dev tab while the caps/dot stay put, exposing the
              torus's flat end faces and stranding the dot outside the gap. */}
          <mesh rotation={[0, 0, THREE.MathUtils.degToRad(RING_ROTATE_DEG)]}>
            <torusGeometry
              args={[
                RING_RADIUS,
                RING_TUBE,
                32,
                160,
                THREE.MathUtils.degToRad(RING_SWEEP_DEG),
              ]}
            />
            <meshPhysicalMaterial
              ref={ringMatRef}
              {...RING_MATERIAL_PROPS}
              transparent
              opacity={1}
            />
          </mesh>

          {/* Rounded caps at the open ends of the arc, echoing the brand mark's round linecap. */}
          <mesh position={capA}>
            <sphereGeometry args={[RING_TUBE, 32, 32]} />
            <meshPhysicalMaterial
              ref={capAMatRef}
              {...RING_MATERIAL_PROPS}
              transparent
              opacity={1}
            />
          </mesh>
          <mesh position={capB}>
            <sphereGeometry args={[RING_TUBE, 32, 32]} />
            <meshPhysicalMaterial
              ref={capBMatRef}
              {...RING_MATERIAL_PROPS}
              transparent
              opacity={1}
            />
          </mesh>

          <group ref={dotGroupRef} position={dotPos}>
            <mesh>
              <sphereGeometry args={[RING_TUBE * 1.6, 32, 32]} />
              <meshPhysicalMaterial
                ref={dotMatRef}
                color="#4F46E5"
                roughness={0.16}
                metalness={0.1}
                clearcoat={1}
                clearcoatRoughness={0.12}
                envMapIntensity={1.6}
                emissive="#4338CA"
                emissiveIntensity={0.55}
                transparent
                opacity={1}
              />
            </mesh>
            <Billboard>
              <mesh renderOrder={1}>
                <planeGeometry args={[GLOW_SIZE, GLOW_SIZE]} />
                <shaderMaterial
                  ref={glowMatRef}
                  uniforms={{
                    uColor: { value: new THREE.Color("#818CF8") },
                    uOpacity: { value: GLOW_BASE_OPACITY },
                  }}
                  vertexShader={GLOW_VERTEX_SHADER}
                  fragmentShader={GLOW_FRAGMENT_SHADER}
                  transparent
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </Billboard>
          </group>
        </group>
      </group>
    </group>
  );
}
