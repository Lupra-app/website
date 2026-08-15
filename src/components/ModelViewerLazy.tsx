"use client";

import dynamic from "next/dynamic";

/**
 * ModelViewer'ı tarayıcıda, ihtiyaç anında yükler.
 *
 * Bu sarmalayıcının ayrı bir dosya olmasının sebebi: `ssr: false` yalnızca
 * client component'lerde kullanılabiliyor, BlockRenderer ise server
 * component. three.js + drei paketi ancak sayfada gerçekten bir 3D bloğu
 * olduğunda indiriliyor.
 */
const ModelViewer = dynamic(() => import("./ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-muted">
      3D görüntüleyici hazırlanıyor…
    </div>
  ),
});

export default function ModelViewerLazy(props: {
  url: string;
  autoRotate: boolean;
  tall: boolean;
}) {
  return <ModelViewer {...props} />;
}
