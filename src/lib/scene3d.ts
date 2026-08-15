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

/**
 * Pixel-space helpers.
 *
 * The mark used to be positioned with viewport FRACTIONS (vwToX), but the page
 * content is a fixed max-width column centred in the viewport. A fraction that
 * lands in the empty gutter on a 1920px screen lands directly on the text at
 * 1200px — which is why the mark kept drifting into headings. Measuring the
 * real content box in pixels and converting here removes the guesswork.
 */

/** World units per CSS pixel at the mark's resting depth. */
export function worldPerPixel() {
  const height = typeof window !== "undefined" ? window.innerHeight : 900;
  return visibleHeightAtOrigin() / height;
}

/** Viewport X in CSS pixels (0 = left edge) to world X. */
export function pxToWorldX(clientX: number) {
  const width = typeof window !== "undefined" ? window.innerWidth : 1440;
  return (clientX - width / 2) * worldPerPixel();
}

/** Viewport Y in CSS pixels (0 = top edge) to world Y. */
export function pxToWorldY(clientY: number) {
  const height = typeof window !== "undefined" ? window.innerHeight : 900;
  return (height / 2 - clientY) * worldPerPixel();
}

/** Mesh scale that renders the mark at a given on-screen diameter in pixels. */
export function pxDiameterToScale(diameterPx: number) {
  return (diameterPx * worldPerPixel()) / RING_BASE_DIAMETER;
}

/**
 * The single source of truth for the mark's pose, shared by every canvas layer.
 *
 * Everything here is written by `Scene3DProvider` (GSAP timelines + one
 * `gsap.ticker` loop) and only ever *read* inside each layer's `useFrame`. That
 * split matters: the depth effect renders the same object in two independent
 * WebGL contexts, and each canvas ticks on its own rAF with its own delta. Any
 * value integrated per-canvas (a spin accumulated from `delta`, a damped tilt)
 * would drift apart between the two, and the two halves of the mark would
 * visibly separate. Integrating once here keeps them frame-locked.
 */
export type SceneTarget = {
  x: number;
  y: number;
  z: number;
  scale: number;
  /** Choreography-driven fade (the scroll timeline dims the mark near the end). */
  opacity: number;
  /** Global show/hide fade, kept separate so it can multiply `opacity` without two timelines fighting over one property. */
  visibility: number;
  dotPulse: number;
  /** Scroll-driven roll, in radians. Animated by the scroll timeline. */
  scrollSpin: number;
  /** Total roll actually applied: `scrollSpin` plus the free-running idle spin. */
  spin: number;
  /** Damped tilt, in radians — base pose plus pointer parallax. */
  tiltX: number;
  tiltY: number;
};

export function createSceneTarget(overrides: Partial<SceneTarget> = {}): SceneTarget {
  return {
    x: 0,
    y: 0,
    z: 0,
    scale: vhToScale(40),
    opacity: 1,
    visibility: 1,
    dotPulse: 1,
    scrollSpin: 0,
    spin: 0,
    tiltX: 0,
    tiltY: 0,
    ...overrides,
  };
}
