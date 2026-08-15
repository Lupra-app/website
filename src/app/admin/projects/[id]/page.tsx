import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { ProjectForm } from "../components/ProjectForm";
import { DeleteProjectButton } from "../components/DeleteProjectButton";

export const metadata = {
  title: "Projeyi Düzenle | Admin",
};

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const supabase = await getSupabaseServer();
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, title, summary, content, status")
    .eq("id", id)
    .single();

  if (!project) notFound();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-white">Projeyi Düzenle</h1>
          <p className="mt-2 font-mono text-sm text-muted">/{project.slug}</p>
        </div>
        <DeleteProjectButton projectId={project.id} projectTitle={project.title} />
      </div>
      <ProjectForm project={project} error={error} />
    </div>
  );
}
