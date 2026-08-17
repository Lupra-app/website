/**
 * Profil bölümünü gerçek bir oturumla test eder.
 *
 * Test kullanıcısı oluşturur, örnek sipariş yazar, sayfaları o oturumun
 * çerezleriyle çeker ve içerikleri doğrular. Sonunda her şeyi siler.
 *
 *   node scripts/profile-test.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const BASE = "http://localhost:3000";
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  process.exitCode = 1;
};

const projectRef = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const email = `profil-testi-${Date.now()}@example.com`;
const password = "ProfilTesti12345!";
let userId = null;

try {
  console.log("\n1) Hazırlık");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    bad(`kullanıcı oluşturulamadı: ${createErr.message}`);
    process.exit(1);
  }
  userId = created.user.id;
  ok(`test kullanıcısı: ${email}`);

  // Örnek siparişler — orders tablosu yoksa buradan anlaşılır.
  const { error: orderErr } = await admin.from("orders").insert([
    {
      user_id: userId,
      order_number: "LUP-2026-0001",
      description: "Lupra Başlangıç · Aylık abonelik",
      amount_cents: 90000,
      currency: "TRY",
      status: "paid",
      period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
      period_end: new Date().toISOString(),
    },
    {
      user_id: userId,
      order_number: "LUP-2026-0002",
      description: "Kurulum ve entegrasyon",
      amount_cents: 350000,
      currency: "TRY",
      status: "pending",
    },
  ]);
  if (orderErr) {
    bad(
      `siparişler yazılamadı (${orderErr.code}) — orders tablosu için ` +
        "supabase/schema.sql çalıştırılmalı"
    );
  } else {
    ok("2 örnek sipariş eklendi (1 ödendi, 1 bekliyor)");
  }

  // --- Oturum ---
  console.log("\n2) Oturum");
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr || !signIn.session) {
    bad(`giriş yapılamadı: ${signInErr?.message}`);
    process.exit(1);
  }
  const cookie = `sb-${projectRef}-auth-token=base64-${Buffer.from(
    JSON.stringify(signIn.session),
    "utf8"
  ).toString("base64url")}`;
  ok("giriş yapıldı");

  async function page(path) {
    const res = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
    return { status: res.status, html: res.status === 200 ? await res.text() : "" };
  }

  // --- Profil sayfası ---
  console.log("\n3) /profil");
  const profil = await page("/profil");
  if (profil.status !== 200) {
    bad(`açılmadı: ${profil.status}`);
  } else {
    ok("açılıyor");
    const checks = [
      ["Üyelik", "üyelik kartı"],
      ["Erken erişim", "erken erişim kartı"],
      ["Toplam ödeme", "toplam ödeme kartı"],
      ["Satın alma geçmişi", "satın alma bölümü"],
      ["LUP-2026-0001", "sipariş numarası görünüyor"],
      ["Ödendi", "ödendi rozeti"],
      ["Bekliyor", "bekliyor rozeti"],
      ["Yorumların", "yorumlar bölümü"],
    ];
    for (const [needle, label] of checks) {
      if (profil.html.includes(needle)) ok(label);
      else bad(label);
    }
    // 900,00 TL formatlanmis mi (kurus -> para birimi)
    if (/900[.,]00/.test(profil.html)) ok("tutar kuruştan doğru çevrilmiş");
    else bad("tutar biçimi beklenenden farklı");
  }

  // --- Siparişler sayfası ---
  console.log("\n4) /profil/siparisler");
  const siparis = await page("/profil/siparisler");
  if (siparis.status !== 200) {
    bad(`açılmadı: ${siparis.status}`);
  } else {
    ok("açılıyor");
    if (siparis.html.includes("LUP-2026-0002")) ok("ikinci sipariş listede");
    else bad("ikinci sipariş görünmüyor");
    if (siparis.html.includes("Toplam ödenen")) ok("toplam ödenen kartı");
    else bad("toplam ödenen kartı yok");
  }

  // --- İzolasyon: başka kullanıcının siparişi sızıyor mu? ---
  console.log("\n5) Veri izolasyonu");
  const { data: other } = await admin.auth.admin.createUser({
    email: `digeri-${Date.now()}@example.com`,
    password,
    email_confirm: true,
  });
  if (other?.user) {
    await admin.from("orders").insert({
      user_id: other.user.id,
      order_number: "LUP-BASKASI-9999",
      description: "Baska kullanicinin siparisi",
      amount_cents: 123456,
      status: "paid",
    });
    const again = await page("/profil/siparisler");
    if (again.html.includes("LUP-BASKASI-9999")) {
      bad("GÜVENLİK: başka kullanıcının siparişi görünüyor!");
    } else {
      ok("başka kullanıcının siparişi görünmüyor");
    }
    await admin.auth.admin.deleteUser(other.user.id);
  }
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
    console.log("\nTemizlik: test kullanıcıları ve siparişleri silindi.");
  }
}

console.log(process.exitCode ? "\n❌ Bazı kontroller başarısız.\n" : "\n✅ Tüm kontroller geçti.\n");
