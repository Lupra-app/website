"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Logo } from "./Logo";

/** Site içi bağlantılar — sosyal hesaplardan ayrı, next/link ile. */
const SITE_LINKS = [
  { label: "Ürünler", href: "/urunler" },
  { label: "Blog", href: "/blog" },
  { label: "Fikirler", href: "/#fikirler" },
  { label: "Giriş", href: "/giris" },
];

const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/lupra" },
  { label: "GitHub", href: "https://github.com/lupra" },
  { label: "LinkedIn", href: "https://linkedin.com/company/lupra" },
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!footerRef.current || prefersReducedMotion()) return;
      gsap.set(footerRef.current, { opacity: 0, y: 16 });
      gsap.to(footerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power2.out",
        scrollTrigger: { trigger: footerRef.current, start: "top 95%" },
      });
    },
    { scope: footerRef }
  );

  return (
    <footer ref={footerRef} className="relative border-t border-white/6 px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-3 text-muted">
          <Logo iconOnly size={22} />
          <span className="text-sm">© 2026 Lupra</span>
        </div>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {SITE_LINKS.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                data-cursor-hover
                className="text-sm font-medium text-muted transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {SOCIAL_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor-hover
                className="text-sm font-medium text-muted transition-colors hover:text-white"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
