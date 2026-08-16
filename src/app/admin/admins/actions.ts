"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
import type { AdminFormState } from "./form-state";

// Durum tipi ve başlangıç değeri ./form-state içinde: bu dosya "use server"
// olduğu için buradan yalnızca async fonksiyon export edilebilir.

function refresh() {
  revalidatePath("/admin/admins");
  revalidatePath("/admin"); // kontrol panelindeki yönetici sayısı
}

export async function addAdmin(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await requireAdmin();
  const email = normalizeEmail(formData.get("email"));

  if (!isValidEmail(email)) {
    return { error: "invalid_email", success: null };
  }

  const { error } = await getSupabaseAdmin().from("admin_users").insert({ email });

  if (error) {
    // 23505 = unique violation. Şemadaki lower(email) index'i sayesinde
    // "Ali@x.com" / "ali@x.com" ikilemi de buraya düşer.
    return { error: error.code === "23505" ? "already_exists" : "server_error", success: null };
  }

  await logAdminAction({
    admin_email: session.email,
    action: "add_admin",
    details: { target_email: email },
  });
  refresh();

  return { error: null, success: `${email} yönetici olarak eklendi.` };
}

export async function removeAdmin(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await requireAdmin();
  const email = normalizeEmail(formData.get("email"));

  if (!email) return { error: "server_error", success: null };
  if (email === session.email) return { error: "cannot_remove_self", success: null };

  const supabase = getSupabaseAdmin();

  const { count } = await supabase.from("admin_users").select("*", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return { error: "last_admin", success: null };

  // .neq(session.email): "say sonra sil" arasında yarış koşulu var — iki
  // yönetici aynı anda işlem yaparsa ikisi de sayımı yeterli görebilir.
  // Bu filtre, hangi sırayla çalışırsa çalışsın kimsenin kendini silememesini
  // garanti eder. Son yöneticiyi koruyan asıl güvence ise DB trigger'ı
  // (supabase/schema.sql → prevent_last_admin_delete).
  const { data: deleted, error } = await supabase
    .from("admin_users")
    .delete()
    .eq("email", email)
    .neq("email", session.email)
    .select("email");

  if (error) {
    if (error.message.includes("last_admin")) {
      return { error: "last_admin", success: null };
    }
    return { error: "server_error", success: null };
  }
  if (!deleted?.length) return { error: "not_found", success: null };

  await logAdminAction({
    admin_email: session.email,
    action: "remove_admin",
    details: { target_email: email },
  });
  refresh();

  return { error: null, success: `${email} yöneticilikten çıkarıldı.` };
}
