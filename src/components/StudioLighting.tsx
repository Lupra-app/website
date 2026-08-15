"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Sanal bir softbox rig'i — fotoğraf HDRI'ı değil.
 *
 * frames={1} ile bir kez küçük bir cubemap'e pişiriliyor; böylece PBR
 * materyaller gerçek yansıma ve kenar ışığı alıyor ama AĞDAN HİÇBİR ŞEY
 * İNDİRİLMİYOR.
 *
 * Bu ayrım önemli: drei'nin hazır ayarları (environment="city" gibi) HDR
 * dosyasını bir dış CDN'den çekiyor. Sitenin CSP'si dış kaynaklara izin
 * vermediği için o istek engelleniyor ve görüntüleyici
 * "Could not load potsdamer_platz_1k.hdr" hatasıyla çöküyordu. Kendi
 * ışığımızı kurmak hem CSP'yi gevşetmekten güvenli, hem de üçüncü parti bir
 * CDN'e bağımlılığı ortadan kaldırıyor.
 */
export function StudioLighting() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer
        form="rect"
        intensity={2.2}
        color="#ffffff"
        position={[-3, 2.5, 2]}
        scale={[3, 4, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={1.1}
        color="#818CF8"
        position={[3, -1.5, 2.5]}
        scale={[3, 3, 1]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="ring"
        intensity={3}
        color="#ffffff"
        position={[0, 0, -4]}
        scale={6}
        target={[0, 0, 0]}
      />
    </Environment>
  );
}
