"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { BackgroundRings } from "./BackgroundRings";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ringRef.current || !dotRef.current) return;
      const textTargets = [headingRef.current, subRef.current, ctaRef.current];

      if (prefersReducedMotion()) {
        gsap.set(ringRef.current, { strokeDashoffset: 0 });
        gsap.set(dotRef.current, { opacity: 1, scale: 1 });
        gsap.set(textTargets, { opacity: 1, y: 0 });
        return;
      }

      const ringLength = ringRef.current.getTotalLength();
      gsap.set(ringRef.current, {
        strokeDasharray: ringLength,
        strokeDashoffset: ringLength,
      });
      gsap.set(dotRef.current, {
        opacity: 0,
        scale: 0.3,
        y: -20,
        transformOrigin: "50% 50%",
      });
      gsap.set(textTargets, { opacity: 0, y: 16 });

      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(ringRef.current, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: "power2.inOut",
      })
        .to(
          dotRef.current,
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" },
          "-=0.2"
        )
        .to(
          textTargets,
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out", stagger: 0.12 },
          "-=0.75"
        );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-28"
    >
      <BackgroundRings />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <div className="mb-10 w-[104px] sm:w-[128px]">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            role="img"
            aria-label="Lupra logosu"
            className="overflow-visible"
          >
            <path
              ref={ringRef}
              d="M35.82 10.33 A22 22 0 1 0 53.67 28.18"
              stroke="#FFFFFF"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle ref={dotRef} cx="47.56" cy="16.44" r="5.5" fill="#818CF8" />
          </svg>
        </div>

        <h1
          ref={headingRef}
          className="max-w-3xl font-heading text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Döngüyü tamamlayan yapay zeka agent’ları.
        </h1>
        <p ref={subRef} className="mt-6 max-w-xl text-balance text-lg text-muted sm:text-xl">
          Operasyonel işini devret. Lupra planlar, yürütür, sonuçlandırır.
        </p>
        <div ref={ctaRef} className="mt-10">
          <a
            href="#early-access"
            className="inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent-light focus-visible:outline-2 focus-visible:outline-accent-light sm:text-base"
          >
            Erken erişime katıl
          </a>
        </div>
      </div>
    </section>
  );
}
