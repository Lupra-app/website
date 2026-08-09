"use client";

import { useRef } from "react";
import { gsap, useGSAP, SplitText, prefersReducedMotion } from "@/lib/gsap";
import { BackgroundRings } from "./BackgroundRings";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!headingRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set([headingRef.current, subRef.current, ctaRef.current], { opacity: 1, y: 0 });
        return;
      }

      const split = new SplitText(headingRef.current, {
        type: "words, chars",
        wordsClass: "word",
        charsClass: "char",
      });
      gsap.set(split.chars, {
        opacity: 0,
        y: 42,
        rotateX: -70,
        transformOrigin: "50% 100%",
        transformPerspective: 600,
      });
      gsap.set([subRef.current, ctaRef.current], { opacity: 0, y: 16 });

      const tl = gsap.timeline({ delay: 0.45 });
      tl.to(split.chars, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.85,
        stagger: 0.014,
        ease: "power3.out",
      })
        .to(subRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.45")
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.4");

      return () => {
        split.revert();
      };
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-svh items-center overflow-hidden pb-20 pt-28"
    >
      <BackgroundRings />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        {/* The 3D mark lives in the global fixed <Scene3D> canvas, not here — this
            spacer just reserves the visual room it occupies at its hero scale. */}
        <div aria-hidden="true" className="mb-6 h-55 sm:h-70 md:h-80" />

        <h1
          ref={headingRef}
          className="max-w-3xl text-balance font-heading text-4xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl md:text-6xl"
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
