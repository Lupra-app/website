import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel ve kimlik doğrulama uçları indekslenmemeli. Gerçek koruma
      // yetkilendirmede (src/lib/dal.ts); bu sadece arama sonuçlarında
      // görünmelerini engelliyor.
      disallow: ["/admin/", "/login", "/api/", "/auth/"],
    },
    sitemap: "https://lupra.app/sitemap.xml",
  };
}
