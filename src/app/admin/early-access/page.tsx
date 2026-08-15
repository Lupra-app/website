import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { EarlyAccessTableClient } from "./components/EarlyAccessTableClient";
import { EarlyAccessLoading } from "./components/EarlyAccessLoading";

async function fetchEarlyAccess() {
  try {
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("early_access")
      .select("id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: String(err) };
  }
}

export const metadata = {
  title: "Erken Erişim | Admin",
};

export default async function EarlyAccessPage() {
  const { data, error } = await fetchEarlyAccess();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-white">
            Erken Erişim Kayıtları
          </h1>
          <p className="mt-2 text-sm text-muted">
            Lupra&apos;ya erişim talebinde bulunan e-posta adreslerinin listesi.
          </p>
        </div>
        {!error && data.length > 0 && (
          <a
            href="/api/admin/early-access-export"
            download
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV&apos;ye Aktar
          </a>
        )}
      </div>

      <Suspense fallback={<EarlyAccessLoading />}>
        <EarlyAccessTableClient data={data} error={error} />
      </Suspense>
    </div>
  );
}
