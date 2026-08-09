"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { createRingMesh, addStandardLighting, disposeRingMesh, FALLBACK_MARK_SVG } from "@/lib/ringMesh";

const START_X = -3.4;
const END_X = 3.4;
const TARGET_OPACITY = 0.4;

export function FeaturesScene({ progress }: { progress: RefObject<{ value: number }> }) {
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
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    addStandardLighting(scene);
    const ring = createRingMesh(1.6, 0.15);
    const { ringMat, ringMesh, dotMat, dotMesh } = ring;

    const spinGroup = new THREE.Group();
    spinGroup.add(ringMesh, dotMesh);
    spinGroup.rotation.set(-0.22, -0.55, 0.08);

    const travelGroup = new THREE.Group();
    travelGroup.add(spinGroup);
    travelGroup.position.x = reduced ? 0 : START_X;
    scene.add(travelGroup);

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
    let revealed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible || revealed) return;
        revealed = true;
        if (reduced) {
          ringMat.opacity = TARGET_OPACITY;
          dotMat.opacity = TARGET_OPACITY;
        } else {
          gsap.to([ringMat, dotMat], { opacity: TARGET_OPACITY, duration: 1.1, ease: "power2.out" });
          gsap.from(spinGroup.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 1.1, ease: "power3.out" });
        }
      },
      { threshold: 0.1 }
    );
    io.observe(container);

    const update = () => {
      if (!visible) return;
      if (!reduced) {
        spinGroup.rotation.y += 0.0011;
        const t = progress.current?.value ?? 0;
        travelGroup.position.x = gsap.utils.interpolate(START_X, END_X, t);
      }
      renderer.render(scene, camera);
    };
    gsap.ticker.add(update);

    return () => {
      gsap.ticker.remove(update);
      ro.disconnect();
      io.disconnect();
      disposeRingMesh(ring);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container?.removeChild(renderer.domElement);
      }
    };
  }, [progress]);

  return <div ref={containerRef} aria-hidden="true" className="h-full w-full" />;
}
