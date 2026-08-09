"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

const R = 26;
const CIRC = 2 * Math.PI * R;

const STEPS = [
  {
    title: "Tanımla",
    desc: "Görevi birkaç cümleyle anlat: hedef, bağlam ve sınırları belirt.",
    progress: 0.32,
  },
  {
    title: "Devret",
    desc: "Lupra planı çıkarır, gerekli araçlara bağlanır ve işi yürütmeye başlar.",
    progress: 0.75,
  },
  {
    title: "Teslim al",
    desc: "Sonuç, ilerleme raporuyla birlikte önüne gelir — döngü kapanır.",
    progress: 1,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-step-card]", sectionRef.current);
      const reduced = prefersReducedMotion();

      cards.forEach((card, i) => {
        const ring = card.querySelector<SVGCircleElement>("[data-step-ring]");
        const connector = card.nextElementSibling?.matches("[data-connector]")
          ? (card.nextElementSibling.querySelector<HTMLElement>("[data-connector-line]") ?? null)
          : null;
        const progress = parseFloat(card.dataset.progress ?? "0");
        const finalOffset = CIRC * (1 - progress);

        if (reduced) {
          gsap.set(card, { opacity: 1, y: 0 });
          if (ring) gsap.set(ring, { strokeDashoffset: finalOffset });
          if (connector) gsap.set(connector, { scaleX: 1 });
          return;
        }

        gsap.set(card, { opacity: 0, y: 28 });
        if (ring) gsap.set(ring, { strokeDashoffset: CIRC });
        if (connector) gsap.set(connector, { scaleX: 0 });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: card, start: "top 82%" },
        });
        tl.to(card, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" });
        if (ring) {
          tl.to(
            ring,
            { strokeDashoffset: finalOffset, duration: 0.9, ease: "power2.inOut" },
            "-=0.5"
          );
        }
        if (connector) {
          tl.to(connector, { scaleX: 1, duration: 0.6, ease: "power2.inOut" }, "-=0.3");
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="how-it-works" ref={sectionRef} className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Nasıl çalışır
        </h2>
        <div className="mt-14 flex flex-col gap-12 sm:flex-row sm:items-start sm:gap-0">
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              <div data-step-card data-progress={step.progress} className="flex flex-col items-start gap-5 sm:flex-1">
                <div className="group">
                  <svg
                    viewBox="0 0 64 64"
                    className="h-14 w-14 -rotate-90 transition-transform duration-500 ease-out group-hover:rotate-[-100deg] group-hover:scale-110"
                    aria-hidden="true"
                  >
                    <circle cx="32" cy="32" r={R} fill="none" stroke="#1A1C26" strokeWidth="6" />
                    <circle
                      data-step-ring
                      cx="32"
                      cy="32"
                      r={R}
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-sm font-medium text-accent-light">0{i + 1}</span>
                  <h3 className="mt-1 font-heading text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-muted">{step.desc}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div data-connector className="hidden items-center px-3 pt-7 sm:flex">
                  <div
                    data-connector-line
                    className="h-px w-10 origin-left bg-white/15 lg:w-16"
                  />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
