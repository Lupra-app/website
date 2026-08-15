import { requireAdminApi } from "@/lib/dal";
import { listEarlyAccessForExport } from "@/lib/admin-data";
import { logAdminAction } from "@/lib/audit-log";
import { formatDateTime } from "@/lib/format";

/**
 * CSV hücresi: RFC 4180 kaçışı + elektronik tablo formül enjeksiyonu koruması.
 *
 * `=`, `+`, `-`, `@`, TAB veya CR ile başlayan bir alan Excel/Sheets'te
 * FORMÜL olarak yorumlanır — `=cmd|'/c calc'!A1` gibi bir e-posta adresi
 * dosyayı açan kişide komut çalıştırmayı deneyebilir. Başa tek tırnak koymak
 * hücreyi metin olarak işaretler.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  let rows;
  try {
    rows = await listEarlyAccessForExport();
  } catch (err) {
    console.error("[export] erken erişim okunamadı:", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  const lines = [
    ["E-posta", "Kayıt Tarihi"].map(csvCell).join(","),
    ...rows.map((row) => [csvCell(row.email), csvCell(formatDateTime(row.created_at))].join(",")),
  ];

  // BOM: Excel UTF-8'i ancak bununla doğru algılıyor, yoksa Türkçe karakterler
  // bozuluyor. \r\n satır sonu da RFC 4180 gereği.
  const csv = "﻿" + lines.join("\r\n");

  await logAdminAction({
    admin_email: auth.session.email,
    action: "export_early_access_csv",
    details: { record_count: rows.length },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lupra-erken-erisim-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
