import * as THREE from "three";

export const RING_GAP_DEG = 70;
export const RING_SWEEP_DEG = 360 - RING_GAP_DEG;
export const RING_DOT_ANGLE_DEG = 45;
export const RING_ROTATE_DEG = 80; // aligns the sweep's natural gap onto the brand's top-right gap

export const FALLBACK_MARK_SVG = `
  <svg viewBox="0 0 64 64" fill="none" style="overflow: visible; width: 100%; height: 100%;">
    <path d="M35.82 10.33 A22 22 0 1 0 53.67 28.18" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" />
    <circle cx="47.56" cy="16.44" r="5.5" fill="#818CF8" />
  </svg>
`;

export function createRingMesh(radius = 1.05, tube = 0.16) {
  const ringGeo = new THREE.TorusGeometry(
    radius,
    tube,
    28,
    120,
    THREE.MathUtils.degToRad(RING_SWEEP_DEG)
  );
  ringGeo.rotateZ(THREE.MathUtils.degToRad(RING_ROTATE_DEG));
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0,
    transparent: true,
    opacity: 0,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);

  const dotGeo = new THREE.SphereGeometry(tube * 1.55, 32, 32);
  const dotMat = new THREE.MeshStandardMaterial({
    color: 0x818cf8,
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: 0,
  });
  const dotMesh = new THREE.Mesh(dotGeo, dotMat);
  const dotAngle = THREE.MathUtils.degToRad(RING_DOT_ANGLE_DEG);
  const dotFinal = new THREE.Vector3(radius * Math.cos(dotAngle), radius * Math.sin(dotAngle), 0);
  dotMesh.position.copy(dotFinal);

  return { ringGeo, ringMat, ringMesh, dotGeo, dotMat, dotMesh, dotFinal };
}

export function addStandardLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.75);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-2.5, 2.6, 3);
  const fill = new THREE.DirectionalLight(0x818cf8, 0.35);
  fill.position.set(2, -1.5, -2);
  scene.add(ambient, key, fill);
  return { ambient, key, fill };
}

export function disposeRingMesh(parts: ReturnType<typeof createRingMesh>) {
  parts.ringGeo.dispose();
  parts.ringMat.dispose();
  parts.dotGeo.dispose();
  parts.dotMat.dispose();
}
