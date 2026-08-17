"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, isTouchDevice } from "@/lib/gsap";

const HOVER_SELECTOR = "a, button, [role='button'], [data-cursor-hover]";
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

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

    /**
     * Nokta ANINDA, halka gecikmeli.
     *
     * Eskiden noktaya da 0.1'lik bir tween veriliyordu ve imleç sürekli
     * fareden geride kalıyordu — kullanıcı bunu "geç ilerliyor" diye tarif
     * etti, haklı. quickSetter tween kurmadan doğrudan transform yazıyor,
     * yani nokta fareyle birebir. Gecikme hissi yalnızca halkada kalıyor ve
     * orada zaten istenen şey o.
     */
    const setDotX = gsap.quickSetter(dot, "x", "px") as (v: number) => void;
    const setDotY = gsap.quickSetter(dot, "y", "px") as (v: number) => void;
    const ringX = gsap.quickTo(ring, "x", { duration: 0.22, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.22, ease: "power3.out" });

    let visible = false;
    const reveal = () => {
      if (visible) return;
      visible = true;
      gsap.to([dot, ring], { opacity: 1, duration: 0.25, overwrite: "auto" });
    };

    const onMove = (e: PointerEvent) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      // İlk harekete kadar gizli: sayfa açılır açılmaz sol üst köşede
      // duran bir imleç görünmesin.
      reveal();
    };

    const onOver = (e: PointerEvent) => {
      const target = e.target as HTMLElement;

      // Metin alanlarında sistem imleci (I-beam) daha kullanışlı.
      if (target.closest(TEXT_SELECTOR)) {
        visible = false;
        gsap.to([dot, ring], { opacity: 0, duration: 0.15, overwrite: "auto" });
        document.documentElement.classList.remove("has-custom-cursor");
        return;
      }
      document.documentElement.classList.add("has-custom-cursor");

      const interactive = Boolean(target.closest(HOVER_SELECTOR));
      gsap.to(ring, {
        scale: interactive ? 1.9 : 1,
        borderColor: interactive ? "rgba(129,140,248,0.9)" : "rgba(255,255,255,0.45)",
        backgroundColor: interactive ? "rgba(129,140,248,0.12)" : "rgba(129,140,248,0)",
        duration: 0.28,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(dot, {
        scale: interactive ? 0 : 1,
        duration: 0.22,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    // Basma geri bildirimi: halka bir an içeri çekiliyor.
    const onDown = () =>
      gsap.to(ring, { scale: 0.8, duration: 0.12, ease: "power2.out", overwrite: "auto" });
    const onUp = (e: PointerEvent) => {
      const interactive = Boolean((e.target as HTMLElement).closest(HOVER_SELECTOR));
      gsap.to(ring, {
        scale: interactive ? 1.9 : 1,
        duration: 0.3,
        ease: "back.out(2)",
        overwrite: "auto",
      });
    };

    const hide = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.2, overwrite: "auto" });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", hide);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", hide);
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
        style={{ borderColor: "rgba(255,255,255,0.45)" }}
        className="pointer-events-none fixed left-0 top-0 z-100 h-8 w-8 rounded-full border opacity-0 will-change-transform"
      />
    </>
  );
}
