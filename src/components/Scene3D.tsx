"use client";

import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import {
  CAMERA_FOV,
  CAMERA_DISTANCE,
  vhToScale,
  vwToX,
  createSceneTarget,
  type SceneTarget,
} from "@/lib/scene3d";
import { LupraMark } from "./LupraMark";

export function Scene3D() {
  const target = useRef<SceneTarget>(createSceneTarget({ scale: vhToScale(40) }));
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animated = !prefersReducedMotion();

  useGSAP(() => {
    const heroEl = document.getElementById("top");
    const howEl = document.getElementById("how-it-works");
    const featuresEl = document.getElementById("features");
    const earlyEl = document.getElementById("early-access");
    const footerEl = document.querySelector("footer");
    if (!heroEl || !howEl || !featuresEl || !earlyEl || !footerEl) return;

    const mm = gsap.matchMedia();

    // Desktop, motion allowed: the full five-scene choreography, scrubbed to
    // scroll across the whole hero -> early-access range in one timeline.
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.set(wrapperRef.current, { opacity: 1 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroEl,
          start: "top top",
          endTrigger: earlyEl,
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Scene 1 -> 2: hero center/large -> left edge, smaller, as "Nasıl çalışır" begins.
      tl.to(
        target.current,
        { x: vwToX(-0.55), y: 0, scale: vhToScale(25), duration: 1, ease: "power2.inOut" },
        0
      )
        // Scene 3: travels downward along the left edge through the how-it-works steps.
        // Bounded (not cumulative) so it never drifts out of the fixed viewport.
        .to(target.current, { y: -1.2, duration: 1.4, ease: "power2.inOut" })
        // Scene 4: drifts left -> right, passing behind the feature cards.
        .to(target.current, { x: vwToX(0.55), y: -0.5, duration: 1.2, ease: "power2.inOut" })
        // Scene 5: returns to center, scales up, settles behind the signup form.
        .to(
          target.current,
          { x: 0, y: 0, scale: vhToScale(50), opacity: 0.5, duration: 1.2, ease: "power2.inOut" }
        )
        // The loop closes: one gentle pulse of the indigo sphere.
        .to(target.current, { dotPulse: 1.35, duration: 0.4, ease: "power2.out" })
        .to(target.current, { dotPulse: 1, duration: 0.4, ease: "power2.inOut" });

      // The choreography above settles once early-access's bottom is reached —
      // but the canvas is fixed to the viewport, so without this it stays
      // parked mid-screen at 0.5 opacity forever, floating over the footer.
      // Fade it out over the footer's own scroll length instead.
      const fadeOut = gsap.to(wrapperRef.current, {
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: footerEl,
          start: "top bottom",
          // Fixed pixel distance rather than an element-relative end: the
          // footer is the last thing on the page, so its own bottom edge
          // can land a few px short of the true max scroll (web font swap
          // reflow) and strand the fade shy of 0. A distance comfortably
          // inside the footer's height always fully completes before the
          // page runs out of room to scroll.
          end: "+=80",
          scrub: true,
        },
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        fadeOut.scrollTrigger?.kill();
        fadeOut.kill();
      };
    });

    // Mobile, or reduced motion: no travel. The object only lives in the hero,
    // fading out once the user scrolls past it (sections use simple DOM reveals).
    mm.add("(max-width: 767.98px), (prefers-reduced-motion: reduce)", () => {
      gsap.set(wrapperRef.current, { opacity: 1 });
      gsap.set(target.current, { x: 0, y: 0, scale: vhToScale(40), opacity: 1 });

      const st = ScrollTrigger.create({
        trigger: heroEl,
        start: "bottom top",
        onEnter: () => gsap.to(wrapperRef.current, { opacity: 0, duration: 0.4 }),
        onLeaveBack: () => gsap.to(wrapperRef.current, { opacity: 1, duration: 0.4 }),
      });
      return () => st.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ fov: CAMERA_FOV, position: [0, 0, CAMERA_DISTANCE], near: 0.1, far: 100 }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[-2.5, 2.5, 3]} intensity={1.1} />
        <directionalLight position={[2.5, -1.5, 2]} intensity={0.5} />
        <LupraMark target={target} animated={animated} />
      </Canvas>
    </div>
  );
}
