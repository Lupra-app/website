"use client";

import { useMemo, useRef, type RefObject } from "react";
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

/**
 * Which slice of the mark this instance draws.
 *
 * `back` and `front` are two halves of the same object rendered in two stacked
 * canvases with the page's text in between, which is what lets the mark pass
 * *through* copy instead of merely over or under it. `full` is the unsplit
 * single-canvas fallback used on mobile and under reduced motion.
 */
export type MarkLayer = "back" | "front" | "full";

// The split happens at the world z = 0 plane, which is where the mark rests and
// therefore where the page's text conceptually lives. The halves overlap by a
// hair so the join never opens into a transparent seam between the two
// independently-composited canvases.
const SEAM_OVERLAP = 0.004;
/** Keeps z <= +overlap — everything at or behind the text plane. */
const FAR_HALF = [new THREE.Plane(new THREE.Vector3(0, 0, -1), SEAM_OVERLAP)];
/** Keeps z >= -overlap — everything at or in front of the text plane. */
const NEAR_HALF = [new THREE.Plane(new THREE.Vector3(0, 0, 1), SEAM_OVERLAP)];

const CLIP_PLANES: Record<MarkLayer, THREE.Plane[] | undefined> = {
  back: FAR_HALF,
  front: NEAR_HALF,
  full: undefined,
};

// Shared prop values for the torus + both end caps so they read as one
// continuous material (matches the brand mark's single-stroke silhouette).
// Each <meshPhysicalMaterial> below still gets its own instance — R3F has no
// cross-element material sharing — this constant just keeps the tuning in
// one place. Clearcoat + moderate roughness gives the polished "soft
// ceramic" look instead of the flat, chalky matte of a plain matte material.
const RING_MATERIAL_PROPS = {
  color: "#101828",
  roughness: 0.42,
  metalness: 0.15,
  clearcoat: 0.6,
  clearcoatRoughness: 0.3,
  envMapIntensity: 1.1,
  // Faint self-illumination floor: without it, the ring's unlit stretches
  // sink into the near-black page background and read as part of the GAP,
  // making the dot look off-centre even when it's measurably centred.
  emissive: "#101828",
  emissiveIntensity: 0.38,
} as const;

// Radial falloff for the dot's fake-glow billboard, computed per-pixel in the
// fragment shader rather than baked into a flat sphere — a solid mesh has no
// way to fade from bright center to transparent edge, so it just reads as a
// hard-edged disc instead of a soft halo. Cheap fake bloom like this costs a
// fraction of a real postprocessing bloom pass — worth it since these canvases
// render full-screen for the entire scroll journey, including on mobile.
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
  layer,
}: {
  target: RefObject<SceneTarget>;
  layer: MarkLayer;
}) {
  const scrollGroupRef = useRef<THREE.Group>(null);
  const spinGroupRef = useRef<THREE.Group>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const dotGroupRef = useRef<THREE.Group>(null);
  const glowMeshRef = useRef<THREE.Mesh>(null);

  // Materials are genuinely mutable (opacity is written every frame below), so
  // — like the group refs above — they're declared in JSX and only ever touched
  // via .current inside useFrame. Reading a ref's value during render, or
  // mutating a value returned from useMemo, both trip this project's hooks
  // linter, which requires render to stay pure.
  const ringMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const capAMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const capBMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const dotMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowMatRef = useRef<THREE.ShaderMaterial>(null);

  const clippingPlanes = CLIP_PLANES[layer];

  const { dotPos, capA, capB, glowUniforms } = useMemo(() => {
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
      glowUniforms: {
        uColor: { value: new THREE.Color("#818CF8") },
        uOpacity: { value: GLOW_BASE_OPACITY },
      },
    };
  }, []);

  const dotWorld = useRef(new THREE.Vector3());

  useFrame(() => {
    const t = target.current;
    const alpha = t.opacity * t.visibility;

    if (scrollGroupRef.current) {
      // Fully faded out (over the footer, or past the hero on mobile) means
      // there is nothing to draw: hiding the root group skips the whole
      // subtree rather than shading transparent pixels every frame.
      scrollGroupRef.current.visible = alpha > 0.001;
      scrollGroupRef.current.position.set(t.x, t.y, t.z);
      scrollGroupRef.current.scale.setScalar(t.scale);
    }
    if (spinGroupRef.current) spinGroupRef.current.rotation.z = t.spin;
    if (tiltGroupRef.current) {
      tiltGroupRef.current.rotation.x = t.tiltX;
      tiltGroupRef.current.rotation.y = t.tiltY;
    }

    if (ringMatRef.current) ringMatRef.current.opacity = alpha;
    if (capAMatRef.current) capAMatRef.current.opacity = alpha;
    if (capBMatRef.current) capBMatRef.current.opacity = alpha;
    if (dotMatRef.current) dotMatRef.current.opacity = alpha;
    if (glowMatRef.current) glowMatRef.current.uniforms.uOpacity.value = GLOW_BASE_OPACITY * alpha;

    if (dotGroupRef.current) {
      dotGroupRef.current.scale.setScalar(t.dotPulse);

      // The glow is a soft halo, not a surface — slicing it at the text plane
      // would leave a hard straight edge across it. So it is left unclipped
      // and instead drawn whole by whichever layer currently holds the dot.
      if (glowMeshRef.current && layer !== "full") {
        dotGroupRef.current.getWorldPosition(dotWorld.current);
        glowMeshRef.current.visible = dotWorld.current.z >= 0 === (layer === "front");
      }
    }
  });

  return (
    <group ref={scrollGroupRef}>
      <group ref={spinGroupRef}>
        <group ref={tiltGroupRef}>
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
              clippingPlanes={clippingPlanes}
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
              clippingPlanes={clippingPlanes}
              transparent
              opacity={1}
            />
          </mesh>
          <mesh position={capB}>
            <sphereGeometry args={[RING_TUBE, 32, 32]} />
            <meshPhysicalMaterial
              ref={capBMatRef}
              {...RING_MATERIAL_PROPS}
              clippingPlanes={clippingPlanes}
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
                clippingPlanes={clippingPlanes}
                transparent
                opacity={1}
              />
            </mesh>
            <Billboard>
              <mesh ref={glowMeshRef} renderOrder={1}>
                <planeGeometry args={[GLOW_SIZE, GLOW_SIZE]} />
                <shaderMaterial
                  ref={glowMatRef}
                  uniforms={glowUniforms}
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
