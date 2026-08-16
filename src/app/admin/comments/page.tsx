import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getBlogStats, listComments } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { EmptyState } from "../components/AdminTable";
import { CommentActions } from "./components/CommentActions";
import { commentStatusBadge, commentStatusLabel } from "@/app/admin/blog/form-state";

export const metadata = { title: "Yorumlar | Admin" };

const STATUS_FILTERS = [
  { value: "pending", label: "Bekleyen" },
  { value: "approved", label: "Onaylanan" },
  { value: "spam", label: "Spam" },
  { value: undefined, label: "Tümü" },
] as const;

function parseCommentStatus(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "pending" || v === "approved" || v === "spam" ? v : undefined;
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  // Varsayılan olarak bekleyenler: bu sayfaya gelme sebebi neredeyse her zaman
  // onay kuyruğunu boşaltmak.
  const status = sp.status === undefined ? "pending" : parseCommentStatus(sp.status);

  const [stats, { rows, total, pageCount }] = await Promise.all([
    getBlogStats(),
    listComments({ page, pageSize: DEFAULT_PAGE_SIZE, status }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Yorumlar</h1>
        <p className="mt-2 text-sm text-muted">
          Yorumlar onaylanmadan sitede görünmez. Bekleyen: {stats.pendingComments}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          const href = filter.value
            ? `/admin/comments?status=${filter.value}`
            : "/admin/comments?status=all";
          return (
            <Link
              key={filter.label}
              href={href}
              aria-current={active ? "true" : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-accent/40 bg-accent/15 text-white"
                  : "border-white/10 bg-white/5 text-muted hover:text-white"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={
            status === "pending"
              ? "Onay bekleyen yorum yok."
              : "Bu filtreye uyan yorum yok."
          }
          hint="Ziyaretçilerin blog yazılarına bıraktığı yorumlar burada listelenir."
        />
      ) : (
        <>
          <div className="space-y-4">
            {rows.map((comment) => (
              <article
                key={comment.id}
                className="glass rounded-2xl border border-white/15 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-medium text-white">{comment.author_name}</span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${commentStatusBadge(comment.status)}`}
                      >
                        {commentStatusLabel(comment.status)}
                      </span>
                      <time className="text-xs text-muted/70">
                        {formatDateTime(comment.created_at)}
                      </time>
                      {comment.country && (
                        <span className="text-xs text-muted/60">{comment.country}</span>
                      )}
                    </div>
                    {comment.posts && (
                      <p className="mt-1 text-xs text-muted">
                        <Link
                          href={`/blog/${comment.posts.slug}`}
                          target="_blank"
                          className="text-accent-light hover:text-white"
                        >
                          {comment.posts.title} ↗
                        </Link>
                      </p>
                    )}
                  </div>
                </div>

                {/* Ziyaretçi metni düz basılıyor — markdown/HTML render etmek
                    panelde de XSS yüzeyi açardı. */}
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                  {comment.body}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <CommentActions id={comment.id} status={comment.status} />
                  {comment.author_email && (
                    <span className="text-xs text-muted/60">{comment.author_email}</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <Pagination
            basePath="/admin/comments"
            filters={{ status }}
            page={page}
            pageCount={pageCount}
            total={total}
            label="yorum"
          />
        </>
      )}
    </div>
  );
}
