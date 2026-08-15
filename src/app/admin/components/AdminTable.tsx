import type { ReactNode } from "react";

/**
 * Admin listelerinin ortak kabuğu. Üç liste sayfası daha önce üç farklı elle
 * yazılmış stil kullanıyordu (biri blur'lu, biri değil, kenarlıklar farklı);
 * hepsi buraya bağlanınca globals.css'teki .glass tek kaynak oluyor.
 */

export function TablePanel({ children }: { children: ReactNode }) {
  return (
    <div className="glass overflow-x-auto rounded-2xl border border-white/15">
      <table className="w-full min-w-[36rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th scope="col" className={`px-6 py-4 font-semibold text-muted ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-white/5 transition-colors hover:bg-white/8">{children}</tr>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass rounded-2xl border border-white/15 px-8 py-12 text-center">
      <p className="text-sm text-white">{title}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-5 text-sm text-red-300"
    >
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const published = status === "published";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
        published
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
          : "border-white/15 bg-white/5 text-muted"
      }`}
    >
      {published ? "Yayında" : "Taslak"}
    </span>
  );
}
