import { redirect } from "next/navigation";

/**
 * Eski yönetici giriş adresi.
 *
 * Artık tek bir giriş sayfası var (/giris) ve yönetici olup olmadığın
 * admin_users allowlist'inden belirleniyor. Bu dosya yalnızca eski yer
 * imlerini ve /admin'den gelen yönlendirmeleri kırmamak için duruyor.
 */
export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("next", sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/admin");
  if (sp.error) params.set("error", sp.error);

  redirect(`/giris?${params}`);
}
