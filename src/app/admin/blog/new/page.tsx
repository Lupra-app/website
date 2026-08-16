import { requireAdmin } from "@/lib/dal";
import { listProjectOptions } from "@/lib/admin-data";
import { PostForm } from "../components/PostForm";

export const metadata = { title: "Yeni Yazı | Admin" };

export default async function NewPostPage() {
  await requireAdmin();
  const projects = await listProjectOptions();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Yeni Yazı</h1>
        <p className="mt-2 text-sm text-muted">
          Taslak olarak kaydedebilir, hazır olunca yayına alabilirsin.
        </p>
      </div>
      <PostForm projects={projects} />
    </div>
  );
}
