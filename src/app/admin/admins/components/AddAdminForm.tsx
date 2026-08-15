"use client";

import { useActionState } from "react";
import { addAdmin, EMPTY_ADMIN_STATE } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: "Geçerli bir e-posta adresi gir.",
  already_exists: "Bu e-posta zaten yönetici listesinde.",
  server_error: "Eklenemedi, tekrar dene.",
};

export function AddAdminForm() {
  const [state, formAction, pending] = useActionState(addAdmin, EMPTY_ADMIN_STATE);

  return (
    <div className="glass mb-8 rounded-2xl border border-white/15 p-5">
      <h2 className="font-heading text-base font-semibold text-white">Yönetici ekle</h2>
      <p className="mt-1 text-xs text-muted">
        Eklenen kişi Google hesabıyla giriş yapıp panele erişebilir.
      </p>

      <form action={formAction} className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          placeholder="ornek@gmail.com"
          aria-label="Yönetici e-posta adresi"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Ekleniyor…" : "Ekle"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
    </div>
  );
}
