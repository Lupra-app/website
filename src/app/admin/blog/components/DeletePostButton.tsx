"use client";

import { useActionState } from "react";
import { deletePost } from "../actions";
import { EMPTY_POST_STATE } from "../form-state";

/**
 * Yazıyı siler. Yorumlar veritabanında ON DELETE CASCADE ile bağlı, yani
 * yazıyla birlikte onlar da gider — onay metni bunu açıkça söylüyor.
 */
export function DeletePostButton({ postId, postTitle }: { postId: string; postTitle: string }) {
  const [state, formAction, pending] = useActionState(deletePost, EMPTY_POST_STATE);

  return (
    <div className="text-right">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm(`"${postTitle}" ve altındaki tüm yorumlar silinecek. Emin misin?`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={postId} />
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Siliniyor…" : "Sil"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {state.error === "not_found" ? "Yazı zaten silinmiş." : "Silinemedi, tekrar dene."}
        </p>
      )}
    </div>
  );
}
