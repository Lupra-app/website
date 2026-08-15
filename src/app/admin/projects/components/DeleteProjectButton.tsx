"use client";

import { deleteProject } from "../actions";

// Silme geri alınamaz; tek client-side görevi submit'ten önce confirm()
// göstermek. Onay JS kapalıyken atlanır ama action yine admin auth'undan
// geçer — confirm bir güvenlik katmanı değil, yanlış tıklama sigortası.
export function DeleteProjectButton({
  projectId,
  projectTitle,
}: {
  projectId: string;
  projectTitle: string;
}) {
  return (
    <form
      action={deleteProject}
      onSubmit={(e) => {
        if (!confirm(`"${projectTitle}" silinecek. Emin misin?`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={projectId} />
      <button
        type="submit"
        className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:border-red-500/60 hover:bg-red-500/20"
      >
        Sil
      </button>
    </form>
  );
}
