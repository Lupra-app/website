import * as THREE from "three";

export const CAMERA_FOV = 35;
export const CAMERA_DISTANCE = 6;

export const RING_GAP_DEG = 70;
export const RING_SWEEP_DEG = 360 - RING_GAP_DEG;
// The gap spans [RING_ROTATE_DEG - RING_GAP_DEG, RING_ROTATE_DEG] = [10deg, 80deg];
// 45deg is the arithmetic midpoint. Verified against the actual rendered
// projection (tilt + camera, via matrixWorld) that this is also where the
// dot sits pixel-equidistant from both cap ends on screen — the fixed tilt
// does foreshorten the two sides differently, but not enough to move the
// balance point off the naive midpoint by more than ~1deg.
export const RING_DOT_ANGLE_DEG = 45;
export const RING_ROTATE_DEG = 80; // aligns the sweep's natural gap onto the brand's top-right gap

export const RING_RADIUS = 1;
export const RING_TUBE = 0.15;
export const RING_BASE_DIAMETER = 2 * (RING_RADIUS + RING_TUBE);

/** World-space viewport height at the object's resting depth (z=0), in Three units. */
function visibleHeightAtOrigin() {
  const fovRad = THREE.MathUtils.degToRad(CAMERA_FOV);
  return 2 * CAMERA_DISTANCE * Math.tan(fovRad / 2);
}

/** Converts a "vh"-style percentage (of viewport height) into a uniform mesh scale. */
export function vhToScale(vhPercent: number) {
  const targetDiameter = (vhPercent / 100) * visibleHeightAtOrigin();
  return targetDiameter / RING_BASE_DIAMETER;
}

/** Converts a fraction of half the viewport width (-1 left edge .. 1 right edge) to world X. */
export function vwToX(fraction: number) {
  const aspect = typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 16 / 9;
  const visibleWidth = visibleHeightAtOrigin() * aspect;
  return fraction * (visibleWidth / 2);
}

export type SceneTarget = {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  dotPulse: number;
};

export function createSceneTarget(overrides: Partial<SceneTarget> = {}): SceneTarget {
  return {
    x: 0,
    y: 0,
    z: 0,
    scale: vhToScale(40),
    opacity: 1,
    dotPulse: 1,
    ...overrides,
  };
}
