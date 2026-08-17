"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Nasıl çalışır" },
  { href: "#urunler", label: "Ürünler" },
  { href: "#fikirler", label: "Fikirler" },
  { href: "#faq", label: "SSS" },
];

/** Oturum bilgisi sunucudan geliyor; Nav'ın kendisi client component kalıyor. */
export type NavSession = { displayName: string | null; email: string; avatarUrl: string | null };

export function Nav({ session }: { session: NavSession | null }) {
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useGSAP(() => {
    if (!headerRef.current || prefersReducedMotion()) return;
    gsap.set(headerRef.current, { opacity: 0, y: -16 });
    gsap.to(headerRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: "power2.out",
      delay: 0.1,
    });
  }, []);

  return (
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-white/6 bg-bg/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8"
        aria-label="Ana gezinme"
      >
        <a href="#top" data-cursor-hover className="rounded-sm">
          <Logo />
        </a>
        <ul className="flex items-center gap-4 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.href} className="hidden sm:block">
              <a
                href={link.href}
                data-cursor-hover
                className="group relative text-xs font-medium text-muted transition-colors hover:text-white sm:text-sm"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent-light transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </a>
            </li>
          ))}

          <li>
            <Link
              href="/blog"
              data-cursor-hover
              className="group relative text-xs font-medium text-muted transition-colors hover:text-white sm:text-sm"
            >
              Blog
              <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent-light transition-transform duration-300 ease-out group-hover:scale-x-100" />
            </Link>
          </li>

          {session ? (
            <li>
              <Link
                href="/profil"
                data-cursor-hover
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1.5 pl-1.5 pr-3 transition-colors hover:border-white/30 sm:pr-4"
              >
                {session.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage */
                  <img src={session.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[10px] font-semibold text-accent-light">
                    {(session.displayName ?? session.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="hidden max-w-[7rem] truncate text-xs text-white sm:inline sm:text-sm">
                  {session.displayName ?? "Profilim"}
                </span>
              </Link>
            </li>
          ) : (
            <>
              <li className="hidden sm:block">
                <Link
                  href="/giris"
                  data-cursor-hover
                  className="text-xs font-medium text-muted transition-colors hover:text-white sm:text-sm"
                >
                  Giriş
                </Link>
              </li>
              <li>
                <Link
                  href="/kayit"
                  data-cursor-hover
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 sm:text-sm"
                >
                  Kayıt ol
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}
