"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { authError, EMPTY_AUTH_STATE } from "../auth-state";
import { authInputClass, authSubmitClass } from "../components/AuthShell";

export function ResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, EMPTY_AUTH_STATE);

  // Adres kayıtlı olmasa bile aynı mesaj gösteriliyor: hangi e-postaların
  // sistemde olduğunu doğrulatmamak için.
  if (state.info) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-300"
      >
        {state.info}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
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

      {state.error && (
        <p role="alert" className="text-sm text-red-400">
          {authError(state.error)}
        </p>
      )}

      <button type="submit" disabled={pending} aria-busy={pending} className={authSubmitClass}>
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>
    </form>
  );
}
