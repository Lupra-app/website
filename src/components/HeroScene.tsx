"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createRingMesh, addStandardLighting, disposeRingMesh, FALLBACK_MARK_SVG } from "@/lib/ringMesh";

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      container.innerHTML = FALLBACK_MARK_SVG;
      return;
    }

    const reduced = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    addStandardLighting(scene);
    const ring = createRingMesh();
    const { ringMat, ringMesh, dotMat, dotMesh, dotFinal } = ring;
    dotMesh.position.add(new THREE.Vector3(0, 0.9, 0));

    const tiltGroup = new THREE.Group();
    tiltGroup.add(ringMesh, dotMesh);

    const spinGroup = new THREE.Group();
    spinGroup.add(tiltGroup);
    spinGroup.scale.setScalar(reduced ? 1 : 0.4);
    tiltGroup.rotation.set(-0.32, reduced ? -0.4 : -1.3, 0);
    scene.add(spinGroup);

    function resize() {
      const { width, height } = container!.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(container);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container!.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const tiltXTo = gsap.quickTo(tiltGroup.rotation, "x", { duration: 0.9, ease: "power3.out" });
    const tiltYTo = gsap.quickTo(tiltGroup.rotation, "y", { duration: 0.9, ease: "power3.out" });

    if (!reduced) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    if (reduced) {
      ringMat.opacity = 1;
      dotMat.opacity = 1;
      dotMesh.position.copy(dotFinal);
      renderer.render(scene, camera);
    } else {
      const tl = gsap.timeline({ delay: 0.2 });
      tl.to(spinGroup.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "power3.out" })
        .to(tiltGroup.rotation, { y: -0.4, duration: 1.2, ease: "power3.out" }, "<")
        .to(ringMat, { opacity: 1, duration: 1, ease: "power2.out" }, "<0.1")
        .to(
          dotMesh.position,
          { x: dotFinal.x, y: dotFinal.y, z: dotFinal.z, duration: 0.65, ease: "back.out(1.6)" },
          "-=0.3"
        )
        .to(dotMat, { opacity: 1, duration: 0.5, ease: "power2.out" }, "<");
    }

    const update = () => {
      if (!visible) return;
      if (!reduced) {
        spinGroup.rotation.y += 0.0016;
        tiltXTo(pointer.y * -0.18 - 0.32);
        tiltYTo(pointer.x * 0.22 - 0.4);
      }
      renderer.render(scene, camera);
    };
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
      window.removeEventListener("pointermove", onPointerMove);
      ro.disconnect();
      io.disconnect();
      disposeRingMesh(ring);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container?.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} role="img" aria-label="Lupra logosu" className="h-full w-full" />;
}
