"use client";

import { useActionState } from "react";
import { removeAdmin } from "../actions";
import { EMPTY_ADMIN_STATE, REMOVE_ADMIN_ERRORS as ERROR_MESSAGES } from "../form-state";

export function RemoveAdminButton({
  email,
  disabled,
  disabledReason,
}: {
  email: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [state, formAction, pending] = useActionState(removeAdmin, EMPTY_ADMIN_STATE);

  return (
    <div className="text-right">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm(`${email} yöneticilikten çıkarılacak. Emin misin?`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={disabled || pending}
          title={disabled ? disabledReason : undefined}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-muted/50"
        >
          {pending ? "Çıkarılıyor…" : "Çıkar"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error}
        </p>
      )}
    </div>
  );
}
