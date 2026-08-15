import { getSupabaseServer } from "@/lib/supabase-server";
import { isAdminAllowed } from "@/config/admin";

export async function GET() {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminAllowed(user.email)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("early_access")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("CSV export error:", error);
    return new Response("Export failed", { status: 500 });
  }

  const csv = [
    "Email,Tarih",
    ...data!.map(
      (row) =>
        `"${row.email}",${new Date(row.created_at).toLocaleString("tr-TR")}`
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="early-access-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
