"use client";

import { useActionState } from "react";
import { deleteProject } from "../actions";
import { EMPTY_PROJECT_STATE } from "../form-state";

// Silme geri alınamaz; confirm() bir güvenlik katmanı değil, yanlış tıklama
// sigortası. Yetki kontrolü her hâlükârda action içinde yapılıyor.
export function DeleteProjectButton({
  projectId,
  projectTitle,
}: {
  projectId: string;
  projectTitle: string;
}) {
  const [state, formAction, pending] = useActionState(deleteProject, EMPTY_PROJECT_STATE);

  return (
    <div className="text-right">
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm(`"${projectTitle}" silinecek. Emin misin?`)) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={projectId} />
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
          {state.error === "not_found"
            ? "Proje zaten silinmiş."
            : "Silinemedi, tekrar dene."}
        </p>
      )}
    </div>
  );
}
