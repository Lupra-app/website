"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const GAP_DEG = 70;
const SWEEP_DEG = 360 - GAP_DEG;
const DOT_ANGLE_DEG = 45;
const RING_ROTATE_DEG = 80; // aligns the sweep's natural gap onto the brand's top-right gap

const FALLBACK_MARK_SVG = `
  <svg viewBox="0 0 64 64" fill="none" style="overflow: visible; width: 100%; height: 100%;">
    <path d="M35.82 10.33 A22 22 0 1 0 53.67 28.18" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
    <circle cx="47.56" cy="16.44" r="5.5" fill="#818CF8" />
  </svg>
`;

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

    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-2.5, 2.6, 3);
    const fill = new THREE.DirectionalLight(0x818cf8, 0.35);
    fill.position.set(2, -1.5, -2);
    scene.add(ambient, key, fill);

    const R = 1.05;
    const TUBE = 0.16;

    const ringGeo = new THREE.TorusGeometry(R, TUBE, 28, 120, THREE.MathUtils.degToRad(SWEEP_DEG));
    ringGeo.rotateZ(THREE.MathUtils.degToRad(RING_ROTATE_DEG));
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);

    const dotGeo = new THREE.SphereGeometry(TUBE * 1.55, 32, 32);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      roughness: 0.6,
      metalness: 0,
      transparent: true,
      opacity: 0,
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    const dotAngle = THREE.MathUtils.degToRad(DOT_ANGLE_DEG);
    const dotFinal = new THREE.Vector3(R * Math.cos(dotAngle), R * Math.sin(dotAngle), 0);
    dotMesh.position.copy(dotFinal).add(new THREE.Vector3(0, 0.9, 0));

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
      ringGeo.dispose();
      ringMat.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container?.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="Lupra logosu"
      className="h-full w-full"
    />
  );
}
