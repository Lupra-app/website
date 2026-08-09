"use client";

import { useRef, useState, type FormEvent } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

export function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const successRingRef = useRef<SVGCircleElement>(null);
  const successCheckRef = useRef<SVGPathElement>(null);
  const successTextRef = useRef<HTMLParagraphElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    // TODO: wire this up to a real endpoint once the backend is ready, e.g.
    // POST /api/early-access with { email } and surface loading/error state.
    console.log("Early access signup:", email);

    setSubmitted(true);
    setEmail("");
  };

  useGSAP(
    () => {
      if (!cardRef.current || prefersReducedMotion()) return;
      gsap.set(cardRef.current, { opacity: 0, y: 32, scale: 0.97 });
      gsap.to(cardRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: cardRef.current, start: "top 82%" },
      });
    },
    { scope: sectionRef }
  );

  useGSAP(
    () => {
      if (!submitted || !successRingRef.current || !successCheckRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set([successRingRef.current, successCheckRef.current], { drawSVG: "100%" });
        gsap.set(successTextRef.current, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(successRingRef.current, { drawSVG: "0%" });
      gsap.set(successCheckRef.current, { drawSVG: "0%" });
      gsap.set(successTextRef.current, { opacity: 0, y: 8 });

      gsap
        .timeline()
        .to(successRingRef.current, { drawSVG: "100%", duration: 0.55, ease: "power2.inOut" })
        .to(
          successCheckRef.current,
          { drawSVG: "100%", duration: 0.4, ease: "power2.out" },
          "-=0.1"
        )
        .to(successTextRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.15");
    },
    { dependencies: [submitted], scope: sectionRef }
  );

  useGSAP(
    () => {
      const el = buttonRef.current;
      if (!el || prefersReducedMotion()) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - rect.left - rect.width / 2) * 0.35);
        yTo((e.clientY - rect.top - rect.height / 2) * 0.35);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: sectionRef }
  );

  return (
    <section id="early-access" ref={sectionRef} className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div
        ref={cardRef}
        className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-white/6 bg-bg-raised/85 px-6 py-14 text-center backdrop-blur-sm sm:px-14"
      >
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Erken erişime katıl
        </h2>
        <p className="mt-4 max-w-md text-muted">
          Lupra aktif geliştirme aşamasında. İlk erişim listesine katıl.
        </p>

        {submitted ? (
          <div className="mt-8 flex flex-col items-center gap-4">
            <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden="true">
              <circle
                ref={successRingRef}
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#818CF8"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                ref={successCheckRef}
                d="M21 33 L28 40 L43 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p ref={successTextRef} role="status" aria-live="polite" className="text-accent-light">
              Teşekkürler! Seni erken erişim listesine ekledik.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            noValidate
          >
            <label htmlFor="early-access-email" className="sr-only">
              E-posta adresin
            </label>
            <input
              id="early-access-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresin"
              aria-label="E-posta adresin"
              className="w-full flex-1 rounded-full border border-white/10 bg-bg px-5 py-3 text-white placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-light"
            />
            <button
              ref={buttonRef}
              type="submit"
              data-cursor-hover
              className="shrink-0 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light focus-visible:outline-2 focus-visible:outline-accent-light"
            >
              Katıl
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
