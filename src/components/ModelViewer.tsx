"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import { useMediaQuery } from "@/lib/media-query";
import { StudioLighting } from "./StudioLighting";

/**
 * Ziyaretçinin fareyle döndürebildiği GLB/GLTF görüntüleyici.
 *
 * Ağır bir bileşen: WebGL bağlamı + model indirmesi. Bu yüzden proje
 * sayfasında next/dynamic ile tembel yükleniyor ve burada da mobilde /
 * hareket kısıtlaması varken hiç mount edilmiyor — bunun yerine statik bir
 * bilgi kutusu gösteriliyor.
 */

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Loader() {
  return (
    <Html center>
      <span className="whitespace-nowrap text-xs text-muted">Model yükleniyor…</span>
    </Html>
  );
}

export default function ModelViewer({
  url,
  autoRotate,
  tall,
}: {
  url: string;
  autoRotate: boolean;
  tall: boolean;
}) {
  const canRender = useMediaQuery("(min-width: 768px)");
  const motionOk = useMediaQuery("(prefers-reduced-motion: no-preference)");
  const heightClass = tall ? "h-[32rem]" : "h-80";

  if (!canRender) {
    return (
      <div
        className={`flex ${heightClass} flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 text-center`}
      >
        <span aria-hidden="true" className="text-4xl">
          🧊
        </span>
        <p className="text-sm text-muted">
          3D model görüntüleyici masaüstünde çalışır — bu sayfayı bilgisayardan açarsan modeli
          döndürebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${heightClass} overflow-hidden rounded-2xl border border-white/10 bg-bg-raised`}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={<Loader />}>
          {/* environment={null} ŞART: drei'nin hazır ortamları ("city" vb.)
              HDR dosyasını dış bir CDN'den indiriyor ve sitenin CSP'si buna
              izin vermiyor. Işığı kendimiz kuruyoruz — ağ isteği yok. */}
          <Stage intensity={0.5} environment={null} adjustCamera>
            <Model url={url} />
          </Stage>
          <StudioLighting />
        </Suspense>
        <OrbitControls
          makeDefault
          autoRotate={autoRotate && motionOk}
          autoRotateSpeed={0.8}
          enablePan={false}
          minDistance={1}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
