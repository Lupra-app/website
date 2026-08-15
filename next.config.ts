import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              // 'unsafe-inline'/'unsafe-eval' bilinçli olarak duruyor: bunları
              // kaldırmak proxy.ts'te istek başına nonce üretmeyi gerektiriyor
              // ve GSAP/three.js/Lenis tarafında regresyon riski taşıyor.
              // Ayrı bir görev olarak ele alınacak.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
              "font-src 'self' https://fonts.gstatic.com; " +
              "img-src 'self' data: blob: https:; " +
              // media-src tanımlı olmasa default-src'ye düşerdi ('self'), yani
              // Supabase Storage'daki videolar sessizce engellenirdi.
              // blob: gerekiyor çünkü panelde yükleme öncesi önizleme
              // blob URL'iyle yapılıyor.
              "media-src 'self' blob: https://*.supabase.co; " +
              // connect-src: hem Storage'a doğrudan yükleme hem de 3D
              // modellerin (GLB) fetch ile indirilmesi buradan geçiyor.
              "connect-src 'self' blob: https://*.supabase.co https://accounts.google.com; " +
              // worker-src: three.js/drei bazı çözücüleri worker'da çalıştırır.
              "worker-src 'self' blob:; " +
              "frame-src 'self' https://accounts.google.com; " +
              // Form hedefini, <base> enjeksiyonunu, iframe'e gömülmeyi ve
              // eklenti gömmeyi kapatır.
              "base-uri 'self'; " +
              "form-action 'self'; " +
              "frame-ancestors 'none'; " +
              "object-src 'none';",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // Panel sayfaları arama sonuçlarında hiç görünmemeli.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
