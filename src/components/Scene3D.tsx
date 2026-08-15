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
import { usePathname } from "next/navigation";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { StudioLighting } from "./StudioLighting";
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
          // Whole journey plays out over one page's worth of scroll, so a
          // fast wheel/trackpad flick used to yank the mark almost instantly
          // from one beat to the next. A heavier scrub lag turns that snap
          // into a catch-up glide without decoupling it from scroll position.
          scrub: 2.2,
        },
      });

      // Beat 1 — get clear of the hero headline, fast.
      //
      // The mark is fixed to the viewport and the headline sits just below it,
      // so as the page scrolls the headline *always* travels up through the
      // mark's horizontal band. No vertical choreography can avoid that; only
      // horizontal separation can. Hence the front-loaded `power3.out` and the
      // short duration — most of the leftward move is spent in the first
      // handful of scrolled pixels, before the headline arrives. Lifting `y`
      // at the same time buys a little extra room by letting the headline pass
      // underneath sooner. (A `sine.inOut` here — slow at both ends — is
      // exactly what made the mark wade straight down through the headline.)
      tl.to(
        t,
        {
          x: vwToX(-0.72),
          y: 0.86,
          scale: vhToScale(38),
          duration: 0.8,
          ease: "power3.out",
        },
        0
      )
        // Beat 2 — swing back in and descend into the "Nasıl çalışır" column.
        // Shrunk from the hero's scale here on: the reserved left column sits
        // directly under the section heading, so the ring's descent always
        // crosses the heading's row at some point on the way down — small is
        // what keeps that crossing brief instead of stamping over the words.
        .to(t, { x: vwToX(-0.42), y: -0.05, scale: vhToScale(14), duration: 1.5, ease: "sine.inOut" }, ">-0.15")
        // Beat 3 — travel down the left column alongside the numbered steps.
        // Bounded (not cumulative) so it can never drift out of the viewport.
        // Small and off to the column's outer edge (x nudged further left of
        // beat 2) rather than dead-centre: the last step's heading sits at
        // this same height, in the column next door, and even at this scale
        // dead-centre was still close enough to clip its first letter as the
        // gap in the ring's sweep rotated past that edge mid-scroll.
        .to(t, { x: vwToX(-0.5), y: -1.15, scale: vhToScale(13), duration: 1.6, ease: "sine.inOut" }, ">-0.3")
        // Beat 4 — sweep past the feature cards. Unlike "Nasıl çalışır" this
        // section has no reserved lane, and the 2-up card grid spans almost
        // the full content width, so there's no horizontal gap to thread
        // through. Split in two so the path goes up-then-across instead of a
        // diagonal cutting straight through the grid: 4a clears the card
        // row's height first (barely moving sideways), 4b does the sideways
        // travel once already above the cards. A single diagonal tween from
        // the steps column to the right edge — tried first — dragged the
        // ring straight across both card titles on the way.
        .to(t, { y: -0.3, scale: vhToScale(15), duration: 1.0, ease: "sine.out" }, ">-0.05")
        .to(t, { x: vwToX(0.78), duration: 1.8, ease: "sine.inOut" }, ">-0.05")
        // Beat 5 — return to centre, then scale up and settle over the signup
        // card. Also split, for the same reason as beat 4: growing to full
        // size *while* still sliding back across the feature cards briefly
        // turned the mark into the biggest, most solid shape it's been all
        // page, right on top of the cards it had just cleared. Recentring
        // small first and only growing once back at x/y 0 keeps the growth
        // confined to the empty band above the signup card.
        .to(t, { x: 0, y: 0, duration: 1.0, ease: "sine.inOut" }, ">-0.35")
        // Held small for a beat after recentring: the page is short enough
        // that the feature cards and the signup card are both still in the
        // scroll range here, so growth waits for a bit more scroll distance
        // to pass — letting the cards scroll further up — before it starts.
        .to(t, { scale: vhToScale(38), opacity: 0.55, duration: 0.9, ease: "sine.inOut" }, ">+=0.75")
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
// The scroll-choreographed mark belongs to the landing page: its timeline
// targets the landing sections, and on any other route (admin, login, project
// pages) it would just park in hero pose with the front canvas (z-30) floating
// over the content. So both layers render only on "/" — the admin layout
// renders its own copy of the mark (Logo3D) behind its glass panels instead.
function useMarkHidden() {
  const pathname = usePathname();
  return pathname !== "/";
}

export function Scene3DBack() {
  const hidden = useMarkHidden();
  const split = useSyncExternalStore(subscribeDepth, getDepthSnapshot, getDepthServerSnapshot);
  if (hidden) return null;
  return <SceneCanvas layer={split ? "back" : "full"} className="z-0" />;
}

export function Scene3DFront() {
  const hidden = useMarkHidden();
  const split = useSyncExternalStore(subscribeDepth, getDepthSnapshot, getDepthServerSnapshot);
  if (hidden || !split) return null;
  return <SceneCanvas layer="front" className="z-30" />;
}
