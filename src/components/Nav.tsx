"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { href: "#how-it-works", label: "Nasıl çalışır" },
  { href: "#early-access", label: "Erken erişim" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-white/[0.06] bg-bg/80 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8"
        aria-label="Ana gezinme"
      >
        <a href="#top" className="rounded-sm">
          <Logo />
        </a>
        <ul className="flex items-center gap-4 sm:gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs font-medium text-muted transition-colors hover:text-white sm:text-sm"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
