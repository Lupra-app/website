import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getProjectById } from "@/lib/admin-data";
import { ProjectForm } from "../components/ProjectForm";
import { DeleteProjectButton } from "../components/DeleteProjectButton";

export const metadata = {
  title: "Projeyi Düzenle | Admin",
};

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">
            Projeyi Düzenle
          </h1>
          <p className="mt-2 font-mono text-sm text-muted">/{project.slug}</p>
        </div>
        <DeleteProjectButton projectId={project.id} projectTitle={project.title} />
      </div>
      <ProjectForm project={project} />
    </div>
  );
}
