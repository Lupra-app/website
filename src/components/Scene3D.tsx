"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import {
  CAMERA_FOV,
  CAMERA_DISTANCE,
  vhToScale,
  vwToX,
  createSceneTarget,
  type SceneTarget,
} from "@/lib/scene3d";
import { LupraMark, type MarkLayer } from "./LupraMark";

// Base pose. The X tilt gives the ring its 3D read; the Y tilt is what makes
// the depth effect legible — it pushes the ring's right side away from the
// camera and pulls its left side toward it, so a horizontal line of text
// crosses in front of one strand and behind the other. With X tilt alone the
// split runs top/bottom, which reads as "the ring is simply in front".
const BASE_TILT_X = THREE.MathUtils.degToRad(-27);
const BASE_TILT_Y = THREE.MathUtils.degToRad(22);
const MAX_TILT_RAD = THREE.MathUtils.degToRad(6);
const TILT_LERP_SPEED = 3;
const IDLE_SPIN_RAD_PER_SEC = 0.08;
/** Total scroll-driven roll across the whole journey (~1.25 turns). */
const SCROLL_SPIN_RAD = Math.PI * 2.5;

// Hero resting pose: the mark sits fully above the headline, in the room the
// hero's spacer div already reserves for it.
//
// It cannot rest *over* the headline now that its front half paints on top of
// the text. Centred, the two side strands ate a syllable out of each line;
// nudged down, the bottom arc runs horizontally along a line and takes a whole
// word. Neither is acceptable for the page's primary message, and no vertical
// offset avoids both — the headline is two lines tall and the ring is taller
// still. So the landing state stays clean and legible, and the pass-through
// effect plays on scroll instead, where it is transient and deliberate: the
// mark sweeps down through this headline the moment the user starts scrolling.
const HERO_Y = 0.66;
const HERO_SCALE_VH = 42;

/**
 * Desktop + motion allowed. Below this the mark renders as a single unsplit
 * layer: the depth effect costs a second WebGL context, and the travel
 * choreography it decorates doesn't run on small screens anyway.
 */
const DEPTH_QUERY = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

function subscribeDepth(callback: () => void) {
  const mql = window.matchMedia(DEPTH_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getDepthSnapshot() {
  return window.matchMedia(DEPTH_QUERY).matches;
}
function getDepthServerSnapshot() {
  return false;
}

const SceneTargetContext = createContext<RefObject<SceneTarget> | null>(null);

function useSceneTarget() {
  const target = useContext(SceneTargetContext);
  if (!target) throw new Error("Scene3D layers must render inside <Scene3DProvider>");
  return target;
}

/**
 * Owns the mark's pose and every animation that drives it. Renders no canvas
 * itself — `<Scene3DLayer>` does that, once behind the page content and once
 * in front of it, both reading this same target.
 */
export function Scene3DProvider({ children }: { children: ReactNode }) {
  const target = useRef<SceneTarget>(
    createSceneTarget({
      y: HERO_Y,
      scale: vhToScale(HERO_SCALE_VH),
      tiltX: BASE_TILT_X,
      tiltY: BASE_TILT_Y,
    })
  );

  // Idle spin and pointer tilt are integrated here, once per frame off
  // gsap.ticker, rather than inside either canvas's useFrame — see the
  // SceneTarget docblock for why per-canvas integration would desync the two
  // halves of the split mark.
  useEffect(() => {
    const t = target.current;
    if (prefersReducedMotion()) {
      t.tiltX = BASE_TILT_X;
      t.tiltY = BASE_TILT_Y;
      t.spin = 0;
      return;
    }

    const pointer = { x: 0, y: 0 };
    let idleSpin = 0;

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const tick = (_time: number, deltaMs: number) => {
      const delta = Math.min(deltaMs, 100) / 1000;
      idleSpin += IDLE_SPIN_RAD_PER_SEC * delta;
      t.spin = t.scrollSpin + idleSpin;
      t.tiltX = THREE.MathUtils.damp(
        t.tiltX,
        BASE_TILT_X + pointer.y * -MAX_TILT_RAD,
        TILT_LERP_SPEED,
        delta
      );
      t.tiltY = THREE.MathUtils.damp(
        t.tiltY,
        BASE_TILT_Y + pointer.x * MAX_TILT_RAD,
        TILT_LERP_SPEED,
        delta
      );
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  useGSAP(() => {
    const heroEl = document.getElementById("top");
    const howEl = document.getElementById("how-it-works");
    const featuresEl = document.getElementById("features");
    const earlyEl = document.getElementById("early-access");
    const footerEl = document.querySelector("footer");
    if (!heroEl || !howEl || !featuresEl || !earlyEl || !footerEl) return;

    const mm = gsap.matchMedia();

    // Desktop, motion allowed: one scrubbed timeline carries the mark from the
    // hero to the signup card. Tweens overlap (each starts slightly before the
    // previous ends) so the mark never fully stops between beats, and every
    // move eases on a sine curve — the gentlest of GSAP's standard eases, which
    // is what keeps a scrubbed transform from feeling stepped.
    mm.add(DEPTH_QUERY, () => {
      const t = target.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          endTrigger: earlyEl,
          end: "bottom bottom",
          scrub: 1.4,
        },
      });

      // Hero -> "Nasıl çalışır": drifts left and shrinks, crossing the heading.
      tl.to(
        t,
        { x: vwToX(-0.5), y: -0.15, scale: vhToScale(26), duration: 1.4, ease: "sine.inOut" },
        0
      )
        // Travels down the left edge alongside the numbered steps. Bounded (not
        // cumulative) so it can never drift out of the fixed viewport.
        .to(t, { y: -1.15, duration: 1.6, ease: "sine.inOut" }, ">-0.3")
        // Sweeps left -> right through the feature cards.
        .to(t, { x: vwToX(0.5), y: -0.55, duration: 1.5, ease: "sine.inOut" }, ">-0.35")
        // Returns to centre, scales up and settles over the signup card.
        .to(
          t,
          { x: 0, y: 0, scale: vhToScale(52), opacity: 0.55, duration: 1.5, ease: "sine.inOut" },
          ">-0.35"
        )
        // The loop closes: one gentle pulse of the indigo sphere.
        .to(t, { dotPulse: 1.3, duration: 0.45, ease: "sine.out" }, ">-0.2")
        .to(t, { dotPulse: 1, duration: 0.5, ease: "sine.inOut" });

      // Roll runs the entire length of the journey at a constant rate, so the
      // mark is always turning even while a positional beat is easing out.
      // Added last, at position 0, with the duration the moves already span —
      // so it stretches across them without extending the timeline.
      tl.to(t, { scrollSpin: SCROLL_SPIN_RAD, duration: tl.duration(), ease: "none" }, 0);

      // The choreography settles once early-access's bottom is reached — but
      // the canvases are fixed to the viewport, so without this the mark stays
      // parked mid-screen forever, floating over the footer. Fade it out over
      // the footer's own scroll length instead.
      const fadeOut = gsap.to(t, {
        visibility: 0,
        ease: "none",
        scrollTrigger: {
          trigger: footerEl,
          start: "top bottom",
          // Fixed pixel distance rather than an element-relative end: the
          // footer is the last thing on the page, so its own bottom edge can
          // land a few px short of the true max scroll (web font swap reflow)
          // and strand the fade shy of 0. A distance comfortably inside the
          // footer's height always completes before the page runs out of room.
          end: "+=80",
          scrub: true,
        },
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        fadeOut.scrollTrigger?.kill();
        fadeOut.kill();
        gsap.set(t, { scrollSpin: 0, opacity: 1, visibility: 1 });
      };
    });

    // Mobile, or reduced motion: no travel. The mark only lives in the hero,
    // fading out once the user scrolls past it (sections use DOM reveals).
    mm.add("(max-width: 767.98px), (prefers-reduced-motion: reduce)", () => {
      const t = target.current;
      gsap.set(t, {
        x: 0,
        y: HERO_Y,
        scale: vhToScale(HERO_SCALE_VH),
        opacity: 1,
        visibility: 1,
        scrollSpin: 0,
      });

      const st = ScrollTrigger.create({
        trigger: heroEl,
        start: "bottom top",
        onEnter: () => gsap.to(t, { visibility: 0, duration: 0.4 }),
        onLeaveBack: () => gsap.to(t, { visibility: 1, duration: 0.4 }),
      });
      return () => {
        st.kill();
        gsap.set(t, { visibility: 1 });
      };
    });

    return () => mm.revert();
  }, []);

  return <SceneTargetContext.Provider value={target}>{children}</SceneTargetContext.Provider>;
}

// A small virtual softbox rig, not a photo HDRI — bakes once (frames={1}) into
// a tiny cubemap so the clearcoat mark gets real specular reflections/rim
// light without fetching an external environment texture over the network.
function StudioLighting() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[-3, 2.5, 2]} scale={[3, 4, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.1} color="#818CF8" position={[3, -1.5, 2.5]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={3} color="#ffffff" position={[0, 0, -4]} scale={6} target={[0, 0, 0]} />
    </Environment>
  );
}

function SceneCanvas({ layer, className }: { layer: MarkLayer; className: string }) {
  const target = useSceneTarget();

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 ${className}`}>
      <Canvas
        dpr={[1, 2]}
        // R3F writes `pointerEvents: 'auto'` onto its own wrapper div, which
        // overrides the `pointer-events-none` inherited from the parent. The
        // front layer sits above the whole page, so without this the canvas
        // swallows every click on the content beneath it — the signup button
        // included. `style` is spread after R3F's own value, so this wins.
        style={{ pointerEvents: "none" }}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE], near: 0.1, far: 100 }}
        onCreated={({ gl }) => {
          // Required for the per-material clipping planes that split the mark
          // into its behind-the-text and in-front-of-the-text halves.
          gl.localClippingEnabled = true;
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[-2.5, 2.5, 3]} intensity={0.9} />
        <directionalLight position={[2.5, -1.5, 2]} intensity={0.4} />
        <StudioLighting />
        <LupraMark key={layer} target={target} layer={layer} />
      </Canvas>
    </div>
  );
}

/**
 * The mark, rendered as up to two stacked canvases so page text can sit
 * *inside* it: the `back` canvas draws only what is farther from the camera
 * than the text plane (z = 0) and sits below the content, the `front` canvas
 * draws only what is nearer and sits above it. Together they composite into
 * one solid object with the DOM text threaded through its middle.
 */
export function Scene3DBack() {
  const split = useSyncExternalStore(subscribeDepth, getDepthSnapshot, getDepthServerSnapshot);
  return <SceneCanvas layer={split ? "back" : "full"} className="z-0" />;
}

export function Scene3DFront() {
  const split = useSyncExternalStore(subscribeDepth, getDepthSnapshot, getDepthServerSnapshot);
  if (!split) return null;
  return <SceneCanvas layer="front" className="z-30" />;
}
