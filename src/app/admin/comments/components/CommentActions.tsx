"use client";

import { useActionState } from "react";
import { moderateComment } from "@/app/admin/blog/actions";
import { EMPTY_COMMENT_STATE } from "@/app/admin/blog/form-state";

/**
 * Tek yorum için moderasyon butonları.
 *
 * Her buton ayrı bir form: `formAction` yerine gizli input + tek action
 * kullanmak, JS kapalıyken de çalışmasını sağlıyor ve hangi durumun
 * seçildiğini belirsizlikten kurtarıyor.
 */
export function CommentActions({ id, status }: { id: string; status: string }) {
  const [state, formAction, pending] = useActionState(moderateComment, EMPTY_COMMENT_STATE);

  const button =
    "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "approved" && (
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="approved" />
          <button
            type="submit"
            disabled={pending}
            className={`${button} border-emerald-400/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20`}
          >
            Onayla
          </button>
        </form>
      )}

      {status !== "spam" && (
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="spam" />
          <button
            type="submit"
            disabled={pending}
            className={`${button} border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20`}
          >
            Spam
          </button>
        </form>
      )}

      {status !== "pending" && (
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="pending" />
          <button
            type="submit"
            disabled={pending}
            className={`${button} border-white/15 bg-white/5 text-muted hover:text-white`}
          >
            Beklemeye al
          </button>
        </form>
      )}

      {state.error && (
        <span role="alert" className="text-xs text-red-300">
          İşlem yapılamadı.
        </span>
      )}
    </div>
  );
}
