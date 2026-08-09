"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

function ExecutionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="4.5" cy="12" r="2" fill="#818CF8" />
      <path
        d="M8 12h9m0 0-3.5-3.5M17 12l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M4 17 9 11l4 3 7-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="6" r="2" fill="#818CF8" />
    </svg>
  );
}

function IntegrationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="18.5" cy="5.5" r="2.5" fill="#818CF8" />
      <path
        d="M7.5 16.5 16.5 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ApprovalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8 12.5 11 15.5 16.5 9"
        stroke="#818CF8"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES: { title: string; desc: string; icon: ReactNode }[] = [
  {
    title: "Uçtan uca yürütme",
    desc: "Görev tanımından sonuca kadar tüm adımları agent yürütür, sen yönü belirlersin.",
    icon: <ExecutionIcon />,
  },
  {
    title: "İlerleme raporlama",
    desc: "Her adımda ne yapıldığını ve neden yapıldığını net raporlarla takip et.",
    icon: <ReportIcon />,
  },
  {
    title: "Araç entegrasyonları",
    desc: "Agent, mevcut araçlarına ve sistemlerine doğrudan bağlanarak işi senin altyapında yürütür.",
    icon: <IntegrationIcon />,
  },
  {
    title: "İnsan onayı adımları",
    desc: "Kritik kararlarda son söz sende — agent, onay noktalarında durup senden onay bekler.",
    icon: <ApprovalIcon />,
  },
];

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const iconEl = iconRef.current;
    if (!el || !iconEl || prefersReducedMotion()) return;

    gsap.set(el, { transformPerspective: 800, transformStyle: "preserve-3d" });

    // A single element can't safely mix quickTo() across x/y/rotateX/rotateY/scale —
    // GSAP's CSSPlugin merges them into one composite transform, and multiple quickTo
    // instances fighting over that composite trip its internal reset cache ("not
    // eligible for reset" warning). Drive them as one gsap.to() per event instead.
    const iconZTo = gsap.quickTo(iconEl, "z", { duration: 0.5, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(el, {
        x: relX * 12,
        y: relY * 12,
        rotateY: relX * 12,
        rotateX: relY * -12,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
    };
    const onEnter = () => {
      gsap.to(el, { scale: 1.02, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      iconZTo(28);
    };
    const onLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
      iconZTo(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      data-feature-card
      data-cursor-hover
      className="rounded-2xl border border-white/6 bg-bg-raised/60 p-6 transition-colors hover:border-white/14"
    >
      <div ref={iconRef} className="text-white">
        {icon}
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
    </div>
  );
}

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || prefersReducedMotion()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-feature-card]", sectionRef.current);

      gsap.set(cards, { opacity: 0, y: 24 });
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-5xl">
        <h2 className="font-heading text-3xl font-semibold text-white sm:text-4xl">
          Neler yapabilir
        </h2>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
