"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Kontrol Paneli", icon: "📊" },
  { href: "/admin/projects", label: "Projeler", icon: "📁" },
  { href: "/admin/early-access", label: "Erken Erişim", icon: "📧" },
  { href: "/admin/activity", label: "Aktivite", icon: "📜" },
  { href: "/admin/admins", label: "Yöneticiler", icon: "👤" },
];

/**
 * Panel navigasyonu — masaüstünde sabit kenar çubuğu, mobilde çekmece.
 *
 * Client component olması iki ihtiyaçtan: aktif bağlantı vurgusu (usePathname)
 * ve çekmecenin açık/kapalı durumu. CSS-only çekmece (gizli checkbox) burada
 * çalışmaz, çünkü soft navigation'da checkbox işaretli kalır ve çekmece
 * sayfa değişince açık kalırdı.
 *
 * Bağlantılar next/link: eskiden düz <a> kullanılıyordu ve her tıklama tam
 * sayfa yenilemesi yapıp layout'u — dolayısıyla 900px'lik three.js sahnesini —
 * baştan yüklüyordu. Soft navigation'da layout mount'ta kalır, sahne kesintisiz
 * döner.
 */
export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  const nav = (
    <nav className="space-y-2">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-all ${
              active
                ? "border-accent/40 bg-accent/15 text-white"
                : "border-white/10 bg-white/5 text-muted hover:border-white/25 hover:bg-white/15 hover:text-white"
            }`}
          >
            <span aria-hidden="true" className="text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-accent-light p-1">
        <Logo iconOnly size={20} />
      </div>
      <span className="font-heading text-lg font-semibold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
        Lupra
      </span>
    </div>
  );

  const account = (
    <div className="glass rounded-2xl border border-white/20 px-4 py-3 text-xs transition-colors hover:border-white/40">
      <p className="truncate font-medium text-muted/80">{email}</p>
      <form action="/api/auth/logout" method="POST" className="mt-3">
        <button
          type="submit"
          className="text-xs font-semibold text-accent-light transition-colors hover:text-white"
        >
          → Çıkış yap
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobil üst bar */}
      <header className="glass fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/15 px-4 md:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menüyü aç"
          aria-expanded={open}
          className="rounded-lg border border-white/15 bg-white/5 p-2 text-white transition-colors hover:bg-white/15"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobil çekmece arka planı */}
      {open && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      {/* Mobil çekmece */}
      <aside
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className={`glass fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/20 px-6 py-8 transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          {brand}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
            className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {nav}
        <div className="mt-auto">{account}</div>
      </aside>

      {/* Masaüstü kenar çubuğu */}
      <aside className="glass sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/20 px-6 py-8 md:flex">
        <div className="mb-12">{brand}</div>
        {nav}
        <div className="mt-auto">{account}</div>
      </aside>
    </>
  );
}
