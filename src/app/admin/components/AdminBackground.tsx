"use client";

import { useMediaQuery } from "@/lib/media-query";
import { Logo3D } from "@/components/Logo3D";

/**
 * Panelin arka planı: gradyan + vinyet her zaman, dönen 3D marka yalnızca
 * geniş ekranda ve hareket kısıtlaması yokken.
 *
 * Canvas'ı CSS ile gizlemek yeterli değil: display:none olan bir <canvas>'ta
 * bile requestAnimationFrame döngüsü çalışmaya devam eder ve mobilde pil
 * boşa yanar. Tek doğru çözüm hiç mount etmemek.
 */
export function AdminBackground() {
  const wideEnough = useMediaQuery("(min-width: 768px)");
  const motionOk = useMediaQuery("(prefers-reduced-motion: no-preference)");
  const showMark = wideEnough && motionOk;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-bg-raised" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(79, 70, 229, 0.14) 0%, transparent 55%)",
        }}
      />
      {showMark && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-35">
          <Logo3D size={900} />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0, 0, 0, 0.65) 100%)",
        }}
      />
    </div>
  );
}
