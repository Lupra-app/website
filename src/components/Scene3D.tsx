"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  pxToWorldX,
  pxToWorldY,
  pxDiameterToScale,
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

/** Smallest gap kept between the mark's outer edge and the window edge. */
const EDGE_MARGIN = 16;

/**
 * The side-travel choreography needs a gutter beside the content to travel in.
 *
 * The content column is max-w-5xl (1024px), so the gutter is
 * (viewport - 1024) / 2. Below ~1200px there is so little of it that the mark
 * would spend the whole journey hidden behind the text — no longer a
 * correctness problem now that it renders behind the page, but pointless to
 * animate. Those widths get the calm version instead, which never moves
 * sideways at all.
 */
const TRAVEL_QUERY = "(min-width: 1200px) and (prefers-reduced-motion: no-preference)";
const CALM_QUERY =
  "(min-width: 768px) and (max-width: 1199.98px) and (prefers-reduced-motion: no-preference)";

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
    // Optional: the choreography adapts to it if present, ignores it if not.
    const faqEl = document.getElementById("faq");
    if (!heroEl || !howEl || !featuresEl || !earlyEl || !footerEl) return;

    const mm = gsap.matchMedia();

    // ---------------------------------------------------------------------
    // Layout probe. Everything below is measured from the real content box,
    // never guessed, and re-measured on every ScrollTrigger refresh.
    //
    // The page is a fixed max-width column centred in the viewport, so the
    // only place the mark can travel without covering text is the gutter
    // beside that column. How wide that gutter is depends entirely on the
    // window, which is exactly what the old viewport-fraction positions
    // failed to account for.
    // ---------------------------------------------------------------------
    const contentEl = howEl.querySelector<HTMLElement>(":scope > div");

    /** Half-width of the widest content column, in CSS pixels. */
    function contentHalfWidth() {
      const measured = contentEl?.getBoundingClientRect().width;
      return (measured && measured > 0 ? measured : Math.min(window.innerWidth - 40, 1024)) / 2;
    }

    /**
     * The lane beside the content column, and how big the mark rides in it.
     *
     * The mark no longer has to fit *inside* the gutter. It renders behind the
     * page, so tucking its inner edge a little way under the content column is
     * harmless — the text paints on top. Sizing it to the gutter alone made it
     * shrink to a speck halfway down the page; keying off viewport height as
     * well keeps it a real object all the way through, closer to the size it
     * had in the hero.
     */
    function lane() {
      const viewportHalf = window.innerWidth / 2;
      const gutter = Math.max(0, viewportHalf - contentHalfWidth());
      const diameter = gsap.utils.clamp(200, 330, Math.max(gutter * 1.35, window.innerHeight * 0.3));
      // Centring the mark in the gutter pushed its outer edge off-screen once
      // it grew wider than the gutter — measured 36px lost at 1440px and 91px
      // at 1200px, i.e. on every laptop width up to 1680px. Pin the outer edge
      // inside the viewport instead. The mark then tucks further under the
      // content column on narrow screens, which costs nothing: it renders
      // behind the page, so the text stays on top of it either way.
      const centreFromEdge = Math.max(gutter / 2, diameter / 2 + EDGE_MARGIN);
      return { gutter, diameter, centreFromEdge };
    }

    const laneX = (side: -1 | 1) => {
      const { centreFromEdge } = lane();
      return pxToWorldX(side < 0 ? centreFromEdge : window.innerWidth - centreFromEdge);
    };
    const laneScale = () => pxDiameterToScale(lane().diameter);

    /**
     * Where a section sits in the journey, as 0..1.
     *
     * Beat timing is derived from this instead of hand-tuned durations: when a
     * section is added or resized (the FAQ block, for instance) the beats move
     * with it automatically. Hand-tuned durations silently desynchronised from
     * the page every time its content changed.
     */
    const journeyStart = () => heroEl.offsetTop;
    const journeyEnd = () => earlyEl.offsetTop + earlyEl.offsetHeight - window.innerHeight;

    function progressOf(el: HTMLElement, bias = 0.5) {
      const start = journeyStart();
      const length = Math.max(1, journeyEnd() - start);
      const centre = el.offsetTop + el.offsetHeight * bias - window.innerHeight / 2;
      return gsap.utils.clamp(0, 1, (centre - start) / length);
    }

    // Wide desktop, motion allowed: the mark leaves the hero, rides the empty
    // gutter down the page beside the content, crosses to the other side, and
    // returns to centre over the signup card.
    //
    // The side trip only exists if there IS a gutter — see TRAVEL_QUERY.
    // Narrower screens get the calm version in the branch after this one.
    mm.add(TRAVEL_QUERY, () => {
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
          // Every horizontal target below is a function of window width
          // (vwToX). Without this they would be baked in at build time and a
          // window resize would leave the mark travelling to positions
          // measured for the old viewport.
          invalidateOnRefresh: true,
        },
      });

      // Beat positions are section positions. The timeline's total duration is
      // 1, so a position IS the journey progress at which that move happens —
      // measured from the DOM rather than accumulated from hand-tuned
      // durations, which is what used to drift out of sync with the page.
      const pSteps = progressOf(howEl, 0.35);
      const pFeatures = progressOf(featuresEl, 0.4);
      const pFaq = progressOf(faqEl ?? featuresEl, 0.5);

      // Hero exit finishes shortly before the steps section reaches centre;
      // the crossing to the far side happens over the feature cards; the
      // return to centre begins once the FAQ is behind us.
      // Clamped so an unusual page order can never push a beat past the end of
      // the timeline — the measurements drive the rhythm, but the journey
      // still has to finish inside its scroll range.
      const exitEnd = gsap.utils.clamp(0.12, 0.4, pSteps - 0.06);
      const crossStart = gsap.utils.clamp(exitEnd + 0.06, 0.72, pFeatures - 0.1);
      const returnStart = gsap.utils.clamp(crossStart + 0.1, 0.88, Math.min(pFaq + 0.08, 0.86));

      tl
        // Beat 1 — slide out of the hero into the left gutter.
        //
        // The mark is fixed to the viewport and the headline scrolls up
        // through its band, so only horizontal separation can keep them apart;
        // `power2.out` front-loads the sideways move so the lane is reached
        // before the headline arrives. It stays out-biased on purpose — a
        // symmetric ease here is what once made the mark wade straight down
        // through the headline.
        .to(
          t,
          {
            x: () => laneX(-1),
            y: () => pxToWorldY(window.innerHeight * 0.34),
            scale: laneScale,
            ease: "power2.out",
            duration: exitEnd,
          },
          0
        )
        // Beat 2 — ride the gutter down beside the steps. Purely vertical:
        // the lane has no text in it at any height, so this can never collide.
        .to(
          t,
          {
            y: () => pxToWorldY(window.innerHeight * 0.66),
            ease: "sine.inOut",
            duration: crossStart - exitEnd,
          },
          exitEnd
        )
        // Beat 3 — cross to the opposite gutter over the feature cards.
        // Lifted while crossing so the path arcs over the card grid instead of
        // cutting through the middle of it.
        .to(
          t,
          {
            x: () => laneX(1),
            y: () => pxToWorldY(window.innerHeight * 0.4),
            ease: "sine.inOut",
            duration: returnStart - crossStart,
          },
          crossStart
        )
        // Beat 4 — return to centre and grow over the signup card. Centre is
        // safe here: the card is max-w-2xl, and the mark settles in the band
        // above it rather than on it.
        .to(
          t,
          {
            x: 0,
            y: 0,
            scale: vhToScale(36),
            opacity: 0.55,
            ease: "sine.inOut",
            duration: Math.max(0.08, 0.92 - returnStart),
          },
          returnStart
        )
        // The loop closes: one gentle pulse of the indigo sphere. Positioned so
        // the timeline ends at exactly 1 — its total duration is what the
        // scroll range maps onto, so an overshoot here would compress
        // everything before it.
        .to(t, { dotPulse: 1.25, duration: 0.04, ease: "sine.out" }, 0.92)
        .to(t, { dotPulse: 1, duration: 0.04, ease: "sine.inOut" }, 0.96);

      // Roll runs the entire length of the journey at a constant rate, so the
      // mark is always turning even while a positional beat is easing out.
      tl.to(t, { scrollSpin: SCROLL_SPIN_RAD, duration: 1, ease: "none" }, 0);

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

    // Mid-width desktop: there is no gutter to travel in, so the mark does not
    // travel. It stays centred in the hero, fades out as the content takes
    // over, and fades back in over the signup card — the same narrative arc,
    // minus the side trip it has no room for. Refusing to move here is what
    // guarantees it never lands on a heading.
    mm.add(CALM_QUERY, () => {
      const t = target.current;
      gsap.set(t, { x: 0, y: HERO_Y, scale: vhToScale(HERO_SCALE_VH), opacity: 1, visibility: 1 });

      const out = gsap.to(t, {
        opacity: 0,
        scale: vhToScale(24),
        ease: "sine.inOut",
        scrollTrigger: { trigger: heroEl, start: "bottom 80%", end: "bottom 20%", scrub: 1.2 },
      });

      const back = gsap.fromTo(
        t,
        { opacity: 0, y: 0, scale: vhToScale(24) },
        {
          opacity: 0.5,
          y: 0,
          scale: vhToScale(30),
          ease: "sine.out",
          scrollTrigger: { trigger: earlyEl, start: "top bottom", end: "top 40%", scrub: 1.2 },
        }
      );

      const spin = gsap.to(t, {
        scrollSpin: SCROLL_SPIN_RAD,
        ease: "none",
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          endTrigger: earlyEl,
          end: "bottom bottom",
          scrub: 2,
        },
      });

      return () => {
        [out, back, spin].forEach((tween) => {
          tween.scrollTrigger?.kill();
          tween.kill();
        });
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
 * The mark, rendered in ONE canvas that sits behind the page content.
 *
 * It used to be split across two stacked canvases — a `back` half below the
 * content and a `front` half above it — so that text appeared threaded through
 * the ring. That effect is gone on purpose: the front half meant the mark
 * could paint over headings, which is exactly what made the page feel broken.
 * A single layer at z-0 can never cover text, and it costs one WebGL context
 * instead of two.
 */
// The scroll-choreographed mark belongs to the landing page: its timeline
// targets the landing sections, so on any other route (admin, login, project
// pages) it would just sit parked in its hero pose. It renders only on "/" —
// the admin layout has its own copy (Logo3D) behind its glass panels.
function useMarkHidden() {
  const pathname = usePathname();
  return pathname !== "/";
}

export function Scene3DBack() {
  const hidden = useMarkHidden();
  if (hidden) return null;
  // z-0 and rendered before the page content in the DOM, so every positioned
  // section paints over it. This is what keeps the mark behind the text.
  return <SceneCanvas layer="full" className="z-0" />;
}
