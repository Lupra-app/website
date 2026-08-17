import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Giriş, kayıt ve şifre sayfalarının ortak kabuğu. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Lupra ana sayfa" className="mx-auto block w-fit">
          <Logo />
        </Link>

        <div className="mt-8 rounded-3xl border border-white/10 bg-bg-raised/85 px-7 py-8 backdrop-blur-sm">
          <h1 className="font-heading text-2xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}

export const authInputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export const authSubmitClass =
  "w-full rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

/** OAuth ile e-posta formunu ayıran çizgi. */
export function AuthDivider() {
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-muted/60">veya</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}
