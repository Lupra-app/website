import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import { Scene3DProvider, Scene3DBack } from "@/components/Scene3D";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lupra.app"),
  title: "Lupra — Operasyonel İşlerini Otomatikleştiren AI Agent’lar",
  description:
    "Lupra, operasyonel işlerini planlayan, yürüten, sonuçlandıran yapay zeka agent platformu. İşini otomatikleştir, kontrol sende kalır. Erken erişime katıl.",
  keywords: [
    "lupra",
    "yapay zeka agent",
    "agent as a service",
    "otomasyon",
    "ai agent",
    "operasyonel otomasyon",
    "iş süreci otomasyonu",
  ],
  alternates: {
    canonical: "https://lupra.app",
  },
  openGraph: {
    title: "Lupra — Operasyonel işlerini otomatikleştir",
    description:
      "Lupra’nın yapay zeka agent’ları planlar, yürütür, sonuçlandırır — sen sadece yönü belirlersin.",
    url: "https://lupra.app",
    siteName: "Lupra",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Lupra" }],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lupra — Operasyonel işlerini otomatikleştir",
    description:
      "Lupra’nın yapay zeka agent’ları planlar, yürütür, sonuçlandırır — sen sadece yönü belirlersin.",
    images: ["/og-image.png"],
  },
};

// Search engines and AI crawlers read this to understand the brand/entity
// beyond page copy — separate from OG/Twitter tags, which only describe this
// one page's preview card.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lupra",
  url: "https://lupra.app",
  logo: "https://lupra.app/icon.png",
  description:
    "Lupra, operasyonel işlerini planlayan, yürüten ve sonuçlandıran yapay zeka agent platformudur.",
  // sameAs (X/GitHub/LinkedIn) kasıtlı olarak boş: Footer.tsx'teki hesaplar
  // henüz doğrulanmadı. Google'a doğrulanmamış bir hesabı resmi Lupra
  // hesabı diye işaretletmek, sameAs eklememekten daha kötü bir hata.
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Lupra",
  url: "https://lupra.app",
  inLanguage: "tr-TR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg font-body text-white antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {/* The animated mark lives in one fixed canvas behind everything.
            It is rendered before the content on purpose: both are positioned
            with an auto/0 z-index, so DOM order is what puts the page text on
            top of it. Never move this below {children}. */}
        <Scene3DProvider>
          <Scene3DBack />
          <CustomCursor />
          <SmoothScroll>{children}</SmoothScroll>
        </Scene3DProvider>
      </body>
    </html>
  );
}
