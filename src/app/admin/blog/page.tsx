import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getBlogStats, listPosts } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, parsePage, parseQuery, parseStatus } from "@/lib/pagination";
import { Pagination } from "../components/Pagination";
import { SearchForm } from "../components/SearchForm";
import { EmptyState, StatusBadge, TablePanel, Td, Th, Tr } from "../components/AdminTable";

export const metadata = { title: "Blog | Admin" };

const STATUS_FILTERS = [
  { value: undefined, label: "Tümü" },
  { value: "published", label: "Yayında" },
  { value: "draft", label: "Taslak" },
] as const;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = parseQuery(sp.q);
  const status = parseStatus(sp.status);

  const [stats, { rows, total, pageCount }] = await Promise.all([
    getBlogStats(),
    listPosts({ page, pageSize: DEFAULT_PAGE_SIZE, q: q || undefined, status }),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-white md:text-3xl">Blog</h1>
          <p className="mt-2 text-sm text-muted">
            lupra.app/blog altında yayınlanan yazılar.
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Yeni Yazı
        </Link>
      </div>

      {stats.pendingComments > 0 && (
        <Link
          href="/admin/comments?status=pending"
          className="mb-8 block rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-200 transition-colors hover:border-amber-400/60"
        >
          <strong className="font-semibold">{stats.pendingComments} yorum onay bekliyor.</strong>{" "}
          Onaylanmadan sitede görünmüyorlar — incelemek için tıkla.
        </Link>
      )}

      <SearchForm
        action="/admin/blog"
        defaultValue={q}
        placeholder="Başlıkta ara…"
        hidden={{ status }}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = status === filter.value;
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          if (filter.value) params.set("status", filter.value);
          const href = params.toString() ? `/admin/blog?${params}` : "/admin/blog";
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
          title={q || status ? "Bu filtreye uyan yazı yok." : "Henüz yazı yok."}
          hint={
            q || status
              ? "Filtreyi değiştir veya temizle."
              : 'İlkini oluşturmak için "Yeni Yazı"ya tıkla.'
          }
        />
      ) : (
        <>
          <TablePanel>
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <Th>Başlık</Th>
                <Th>Slug</Th>
                <Th>Etiketler</Th>
                <Th>Durum</Th>
                <Th>Güncelleme</Th>
                <Th className="text-right">İşlem</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((post) => (
                <Tr key={post.id}>
                  <Td className="font-medium text-white">
                    <span className="flex items-center gap-3">
                      {post.cover_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- panel içi önizleme */
                        <img
                          src={post.cover_url}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-md border border-white/10 object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs text-muted/50">
                          —
                        </span>
                      )}
                      {post.title}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs text-muted">/{post.slug}</Td>
                  <Td className="text-xs text-muted">
                    {post.tags?.length ? post.tags.slice(0, 3).join(", ") : "—"}
                  </Td>
                  <Td>
                    <StatusBadge status={post.status} />
                  </Td>
                  <Td className="text-xs text-muted">{formatDateTime(post.updated_at)}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {post.status === "published" && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted transition-colors hover:text-white"
                        >
                          Görüntüle ↗
                        </a>
                      )}
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="text-xs font-semibold text-accent-light transition-colors hover:text-white"
                      >
                        Düzenle
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TablePanel>

          <Pagination
            basePath="/admin/blog"
            filters={{ q: q || undefined, status }}
            page={page}
            pageCount={pageCount}
            total={total}
            label="yazı"
          />
        </>
      )}
    </div>
  );
}
