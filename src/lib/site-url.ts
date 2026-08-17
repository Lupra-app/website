import "server-only";
import { headers } from "next/headers";

/**
 * E-postalara gömülecek mutlak site adresi.
 *
 * NEDEN İSTEK BAŞLIĞINDAN ÜRETİLMİYOR: doğrulama ve şifre sıfırlama
 * bağlantıları `Host` başlığından kuruluyordu. O başlık istemci kontrolünde —
 * saldırgan, kurbanın adresiyle "şifremi unuttum" isteğini sahte bir Host ile
 * gönderip, kurbanın posta kutusuna KENDİ sunucusuna giden bir sıfırlama
 * bağlantısı düşürebilir. Kurban tıklarsa token saldırgana gider.
 *
 * Supabase'in Redirect URL allowlist'i buna karşı ikinci bir savunma, ama
 * allowlist'te tek bir geniş kalıp (ör. bir wildcard) yeterli olur. Adresi
 * env'e sabitlemek, kontrolü tamamen bize alır.
 *
 * Yerelde ve NEXT_PUBLIC_SITE_URL tanımlı değilken eski davranış sürüyor,
 * yoksa `npm run dev` çalışmazdı.
 */
export async function emailSiteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
