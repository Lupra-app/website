"use client";

import { useActionState } from "react";
import { updateEmail, updatePassword, deleteAccount } from "../actions";
import { EMPTY_PROFILE_STATE, profileError } from "../profile-state";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-muted/50 transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Feedback({ state }: { state: { error: string | null; info: string | null } }) {
  if (state.info) {
    return (
      <p role="status" className="text-sm text-emerald-300">
        {state.info}
      </p>
    );
  }
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-red-300">
        {profileError(state.error)}
      </p>
    );
  }
  return null;
}

export function EmailSettings({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateEmail, EMPTY_PROFILE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">
          E-posta adresi <span className="text-muted/60">— şu an: {currentEmail}</span>
        </span>
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          placeholder="yeni@ornek.com"
          className={inputClass}
        />
      </label>
      <p className="text-xs text-muted/70">
        Yeni adrese doğrulama bağlantısı gönderilir. Tıklayana kadar eski adresin geçerli kalır.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          {pending ? "Gönderiliyor…" : "E-postayı değiştir"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState(updatePassword, EMPTY_PROFILE_STATE);

  return (
    <form action={formAction} className="space-y-4">
      {!hasPassword && (
        <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-muted">
          Hesabına GitHub veya Google ile giriş yapıyorsun. Buradan bir şifre belirlersen
          e-posta + şifre ile de girebilirsin.
        </p>
      )}

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">
          {hasPassword ? "Yeni şifre" : "Şifre belirle"}{" "}
          <span className="text-muted/60">— en az 8 karakter</span>
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Şifre tekrar</span>
        <input
          type="password"
          name="password_again"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : hasPassword ? "Şifreyi değiştir" : "Şifre belirle"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteAccount({ email, isAdmin }: { email: string; isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(deleteAccount, EMPTY_PROFILE_STATE);

  if (isAdmin) {
    return (
      <p className="text-sm text-muted">
        Yönetici hesapları buradan silinemez. Önce <code className="font-mono">/admin/admins</code>{" "}
        üzerinden yöneticilikten çıkarılman gerekiyor.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Hesabın ve tüm profil verin kalıcı olarak silinecek. Emin misin?")) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <p className="text-sm text-muted">
        Hesabın kalıcı olarak silinir ve geri alınamaz. Onaylamak için e-posta adresini yaz:{" "}
        <strong className="text-white">{email}</strong>
      </p>

      <input
        name="confirm_email"
        required
        placeholder={email}
        autoComplete="off"
        className={inputClass}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20 disabled:opacity-60"
        >
          {pending ? "Siliniyor…" : "Hesabımı kalıcı olarak sil"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
