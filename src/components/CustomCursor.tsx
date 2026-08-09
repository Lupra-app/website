"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, isTouchDevice } from "@/lib/gsap";

const HOVER_SELECTOR = "a, button, input, [data-cursor-hover]";
const TEXT_SELECTOR = "input, textarea";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isTouchDevice()) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("has-custom-cursor");
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3.out" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3.out" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(TEXT_SELECTOR)) {
        gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
        return;
      }
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
      if (target.closest(HOVER_SELECTOR)) {
        gsap.to(ring, { scale: 1.7, duration: 0.35, ease: "power3.out" });
        gsap.to(dot, { scale: 0, duration: 0.25, ease: "power3.out" });
      } else {
        gsap.to(ring, { scale: 1, duration: 0.35, ease: "power3.out" });
        gsap.to(dot, { scale: 1, duration: 0.25, ease: "power3.out" });
      }
    };

    const onLeaveWindow = () => gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
    const onEnterWindow = () => gsap.to([dot, ring], { opacity: 1, duration: 0.2 });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-100 h-1.5 w-1.5 rounded-full bg-white opacity-0 will-change-transform"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-100 h-7 w-7 rounded-full border border-white/50 opacity-0 will-change-transform"
      />
    </>
  );
}
