"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { safeNext } from "../auth-state";

/**
 * GitHub ve Google ile giriş.
 *
 * OAuth tarayıcıda başlatılıyor: signInWithOAuth sağlayıcının sayfasına
 * yönlendirme yapıyor, dönüşte /auth/callback oturumu kuruyor.
 */
export function OAuthButtons({ next }: { next?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = async (provider: "github" | "google") => {
    setBusy(provider);
    setError(null);

    const target = safeNext(next);
    const { error: oauthError } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`,
      },
    });

    if (oauthError) {
      // Sağlayıcı Supabase panelinden etkinleştirilmemişse buraya düşer.
      setError(
        oauthError.message.toLowerCase().includes("provider is not enabled")
          ? `${provider === "github" ? "GitHub" : "Google"} girişi henüz etkin değil.`
          : "Giriş başlatılamadı, tekrar dene."
      );
      setBusy(null);
    }
  };

  const base =
    "flex w-full items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => start("github")}
        disabled={busy !== null}
        className={`${base} bg-white text-bg`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
          <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.15v3.19c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
        </svg>
        {busy === "github" ? "Yönlendiriliyor…" : "GitHub ile devam et"}
      </button>

      <button
        type="button"
        onClick={() => start("google")}
        disabled={busy !== null}
        className={`${base} border border-white/15 bg-white/5 text-white hover:bg-white/10`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.99 11.99 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
          />
        </svg>
        {busy === "google" ? "Yönlendiriliyor…" : "Google ile devam et"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
