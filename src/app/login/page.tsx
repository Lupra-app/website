import { Logo } from "@/components/Logo";
import { GoogleSignInButton } from "./components/GoogleSignInButton";

export const metadata = {
  title: "Admin girişi | Lupra",
  robots: { index: false, follow: false },
};

// Hata mesajları sunucuda çözülüyor: sayfa artık server component, böylece
// eski `typeof window` okumasının taşıdığı hydration uyumsuzluğu riski yok.
const ERROR_MESSAGES: Record<string, string> = {
  forbidden:
    "Bu hesap yönetici listesinde değil. Erişim için mevcut bir yöneticiye başvur.",
  auth_failed: "Giriş doğrulanamadı, tekrar dene.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.auth_failed) : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-5">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/6 bg-bg-raised/85 px-8 py-12 text-center backdrop-blur-sm">
        <Logo />
        <h1 className="mt-6 font-heading text-2xl font-semibold text-white">Admin girişi</h1>
        <p className="mt-2 text-sm text-muted">Devam etmek için Google hesabınla giriş yap.</p>

        {message && (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {message}
          </p>
        )}

        <GoogleSignInButton />
      </div>
    </main>
  );
}
