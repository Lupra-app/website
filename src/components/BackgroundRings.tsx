"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

const RINGS = [
  {
    className: "absolute -right-56 -top-40 h-[560px] w-[560px] sm:h-[720px] sm:w-[720px]",
    parallax: 10,
    spin: 120,
    direction: 1,
    scrollShift: 16,
  },
  {
    className: "absolute -bottom-52 -left-48 h-[480px] w-[480px] sm:h-[620px] sm:w-[620px]",
    parallax: 16,
    spin: 160,
    direction: -1,
    scrollShift: -12,
  },
  {
    className: "absolute -bottom-24 -right-24 hidden h-[320px] w-[320px] sm:block",
    parallax: 22,
    spin: 90,
    direction: 1,
    scrollShift: 22,
  },
];

export function BackgroundRings() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return;

      const rings = containerRef.current.querySelectorAll<SVGSVGElement>("[data-ring]");
      rings.forEach((ring, i) => {
        const cfg = RINGS[i];
        gsap.to(ring, {
          yPercent: cfg.scrollShift,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
        gsap.to(ring, {
          rotation: 360 * cfg.direction,
          duration: cfg.spin,
          ease: "none",
          repeat: -1,
          transformOrigin: "50% 50%",
        });
      });
    },
    { scope: containerRef }
  );

  useEffect(() => {
    const container = containerRef.current;
    if (prefersReducedMotion() || !container) return;

    const rings = container.querySelectorAll<SVGSVGElement>("[data-ring]");
    const movers = Array.from(rings).map((ring, i) => ({
      x: gsap.quickTo(ring, "x", { duration: 1.1, ease: "power3.out" }),
      y: gsap.quickTo(ring, "y", { duration: 1.1, ease: "power3.out" }),
      strength: RINGS[i].parallax,
    }));

    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => {
        m.x(nx * m.strength);
        m.y(ny * m.strength);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {RINGS.map((ring, i) => (
        <svg key={i} data-ring viewBox="0 0 100 100" className={ring.className}>
          <circle
            cx="50"
            cy="50"
            r="49"
            fill="none"
            stroke="#1A1C26"
            strokeWidth="0.6"
            strokeDasharray="290 18"
          />
        </svg>
      ))}
    </div>
  );
}
