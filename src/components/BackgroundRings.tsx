"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export function BackgroundRings() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;

      const rings = containerRef.current.querySelectorAll<SVGSVGElement>("[data-ring]");
      rings.forEach((ring, i) => {
        gsap.to(ring, {
          yPercent: i % 2 === 0 ? 16 : -12,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        data-ring
        viewBox="0 0 100 100"
        className="absolute -right-56 -top-40 h-[560px] w-[560px] sm:h-[720px] sm:w-[720px]"
      >
        <circle cx="50" cy="50" r="49" fill="none" stroke="#1A1C26" strokeWidth="0.6" />
      </svg>
      <svg
        data-ring
        viewBox="0 0 100 100"
        className="absolute -bottom-52 -left-48 h-[480px] w-[480px] sm:h-[620px] sm:w-[620px]"
      >
        <circle cx="50" cy="50" r="49" fill="none" stroke="#1A1C26" strokeWidth="0.6" />
      </svg>
    </div>
  );
}
