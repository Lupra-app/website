import { requireAdmin } from "@/lib/dal";
import { ProjectForm } from "../components/ProjectForm";

export const metadata = {
  title: "Yeni Proje | Admin",
};

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Yeni Proje</h1>
        <p className="mt-2 text-sm text-muted">
          Taslak olarak kaydedebilir, hazır olunca yayına alabilirsin.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
