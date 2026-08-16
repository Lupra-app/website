import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/dal";
import { getPostById, listProjectOptions } from "@/lib/admin-data";
import { PostForm } from "../components/PostForm";
import { DeletePostButton } from "../components/DeletePostButton";

export const metadata = { title: "Yazıyı Düzenle | Admin" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [post, projects] = await Promise.all([getPostById(id), listProjectOptions()]);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">
            Yazıyı Düzenle
          </h1>
          <p className="mt-2 font-mono text-sm text-muted">/blog/{post.slug}</p>
        </div>
        <DeletePostButton postId={post.id} postTitle={post.title} />
      </div>
      <PostForm post={post} projects={projects} />
    </div>
  );
}
