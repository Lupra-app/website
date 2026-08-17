"use client";

import { useActionState } from "react";
import { signUpWithPassword, resendConfirmation } from "../actions";
import { authError, EMPTY_AUTH_STATE, MIN_PASSWORD } from "../auth-state";
import { AuthDivider, authInputClass, authSubmitClass } from "../components/AuthShell";

export function SignUpForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signUpWithPassword, EMPTY_AUTH_STATE);
  const [resendState, resendAction, resending] = useActionState(
    resendConfirmation,
    EMPTY_AUTH_STATE
  );
  const message = authError(state.error);

  // Kayıt başarılı olduğunda oturum AÇILMIYOR (e-posta doğrulaması zorunlu).
  // Kullanıcıya ne olduğunu açıkça söylemezsek hesabın açılmadığını sanıyor.
  if (state.emailSent) {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm">
        <p className="font-semibold text-emerald-300">E-postana bir bağlantı gönderdik</p>
        <p className="mt-2 text-muted">
          <strong className="text-white">{state.emailSent}</strong> adresine gönderdiğimiz
          doğrulama bağlantısına tıkla; hesabın o zaman aktifleşecek.
        </p>

        <form action={resendAction} className="mt-4">
          <input type="hidden" name="email" value={state.emailSent} />
          <button
            type="submit"
            disabled={resending}
            className="text-xs font-semibold text-accent-light transition-colors hover:text-white disabled:opacity-60"
          >
            {resending ? "Gönderiliyor…" : "E-posta gelmedi mi? Tekrar gönder"}
          </button>
        </form>

        {resendState.info && (
          <p role="status" className="mt-2 text-xs text-emerald-300">
            {resendState.info}
          </p>
        )}
        {resendState.error && (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {authError(resendState.error)}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <AuthDivider />

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">E-posta</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            maxLength={254}
            className={authInputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Şifre <span className="text-muted/60">— en az {MIN_PASSWORD} karakter</span>
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className={authInputClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">Şifre tekrar</span>
          <input
            type="password"
            name="password_again"
            required
            minLength={MIN_PASSWORD}
            autoComplete="new-password"
            className={authInputClass}
          />
        </label>

        {message && (
          <p role="alert" className="text-sm text-red-400">
            {message}
          </p>
        )}

        <button type="submit" disabled={pending} aria-busy={pending} className={authSubmitClass}>
          {pending ? "Hesap oluşturuluyor…" : "Hesap oluştur"}
        </button>
      </form>
    </>
  );
}
