import { ProjectForm } from "../components/ProjectForm";

export const metadata = {
  title: "Yeni Proje | Admin",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-white">Yeni Proje</h1>
        <p className="mt-2 text-sm text-muted">
          Taslak olarak kaydedebilir, hazır olunca yayına alabilirsin.
        </p>
      </div>
      <ProjectForm error={error} />
    </div>
  );
}
