"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithPassword } from "../actions";
import { authError, EMPTY_AUTH_STATE } from "../auth-state";
import { AuthDivider, authInputClass, authSubmitClass } from "../components/AuthShell";

export function SignInForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInWithPassword, EMPTY_AUTH_STATE);
  const message = authError(state.error);

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
          <span className="mb-1.5 block text-xs font-medium text-muted">Şifre</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className={authInputClass}
          />
        </label>

        {message && (
          <p role="alert" className="text-sm text-red-400">
            {message}
          </p>
        )}

        <button type="submit" disabled={pending} aria-busy={pending} className={authSubmitClass}>
          {pending ? "Giriş yapılıyor…" : "Giriş yap"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs">
        <Link href="/sifre-sifirla" className="text-muted transition-colors hover:text-white">
          Şifreni mi unuttun?
        </Link>
      </p>
    </>
  );
}
