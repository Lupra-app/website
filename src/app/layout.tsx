import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { CustomCursor } from "@/components/CustomCursor";
import { Scene3DProvider, Scene3DBack, Scene3DFront } from "@/components/Scene3D";
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
  title: "Lupra — Döngüyü tamamlayan yapay zeka agent’ları",
  description:
    "Lupra, operasyonel işlerini planlayan, yürüten ve sonuçlandıran Agent-as-a-Service platformudur. Erken erişime katıl.",
  keywords: ["lupra", "yapay zeka agent", "agent as a service", "otomasyon", "ai agent"],
  openGraph: {
    title: "Lupra — Döngüyü tamamlayan yapay zeka agent’ları",
    description: "Operasyonel işini devret. Lupra planlar, yürütür, sonuçlandırır.",
    url: "https://lupra.app",
    siteName: "Lupra",
    images: [{ url: "/og-image.png", width: 1024, height: 1024, alt: "Lupra" }],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lupra — Döngüyü tamamlayan yapay zeka agent’ları",
    description: "Operasyonel işini devret. Lupra planlar, yürütür, sonuçlandırır.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg font-body text-white antialiased">
        {/* The mark straddles the page content: Scene3DBack draws the half
            farther from the camera than the text plane, Scene3DFront draws the
            nearer half on top. Both must stay inside the same provider — they
            share one pose, and split rendering only holds together if neither
            layer integrates its own animation state. */}
        <Scene3DProvider>
          <Scene3DBack />
          <CustomCursor />
          <SmoothScroll>{children}</SmoothScroll>
          <Scene3DFront />
        </Scene3DProvider>
      </body>
    </html>
  );
}
