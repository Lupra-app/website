"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/dal";
import { logAdminAction } from "@/lib/audit-log";
import { UUID_RE } from "@/lib/validation";
import type { EarlyAccessFormState } from "./form-state";

const VALID_STATUSES = new Set(["new", "invited", "joined"]);
const MAX_NOTE = 1000;

/**
 * Bir kaydın davet durumunu ve notunu günceller.
 *
 * Kayıt silme bilinçli olarak yok: erken erişim listesi kimin ne zaman
 * kaydolduğunun kaydı ve panelden tek tıkla silinebilir olması istenmedi.
 * Bir kaydın listeden çıkması gerekiyorsa Supabase üzerinden yapılır.
 */
export async function updateEarlyAccessStatus(
  _prevState: EarlyAccessFormState,
  formData: FormData
): Promise<EarlyAccessFormState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!UUID_RE.test(id)) return { error: "not_found", saved: false };

  const status = String(formData.get("status") ?? "");
  if (!VALID_STATUSES.has(status)) return { error: "invalid_status", saved: false };

  const note = String(formData.get("note") ?? "").trim();
  if (note.length > MAX_NOTE) return { error: "note_too_long", saved: false };

  // .select() olmadan Supabase kaç satırın etkilendiğini söylemiyor; onsuz
  // var olmayan bir id sessizce "başarılı" dönerdi.
  const { data, error } = await getSupabaseAdmin()
    .from("early_access")
    .update({
      status,
      note: note || null,
      status_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, email");

  if (error) {
    console.error("[early-access] durum güncellenemedi:", error.code, error.message);
    return { error: "server_error", saved: false };
  }
  if (!data?.length) return { error: "not_found", saved: false };

  await logAdminAction({
    admin_email: session.email,
    action: "update_early_access_status",
    details: { record_id: id, email: data[0].email, status },
  });

  revalidatePath("/admin/early-access");
  revalidatePath("/admin");

  return { error: null, saved: true };
}
