/**
 * Hesap sistemi güvenlik testi.
 *
 * Gerçek bir kullanıcı oluşturur, gerçek bir oturum açar ve o oturumun
 * çerezleriyle korumalı sayfalara istek atar. Asıl soru: normal bir kullanıcı
 * yönetim paneline girebiliyor mu?
 *
 *   node scripts/auth-security-test.mjs
 *
 * Test kullanıcısı sonunda silinir.
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
const email = `guvenlik-testi-${Date.now()}@example.com`;
const password = "GuvenlikTesti12345!";
let userId = null;

async function cleanup() {
  if (userId) {
    await admin.auth.admin.deleteUser(userId);
    console.log("\nTemizlik: test kullanıcısı silindi.");
  }
}

try {
  // --- 1. Normal kullanıcı oluştur (yönetici DEĞİL) ---
  console.log("\n1) Test kullanıcısı");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // doğrulama mailini atlamak için
  });
  if (createErr) {
    bad(`kullanıcı oluşturulamadı: ${createErr.message}`);
    process.exit(1);
  }
  userId = created.user.id;
  ok(`oluşturuldu: ${email}`);

  const { data: adminRows } = await admin.from("admin_users").select("email");
  const isInAllowlist = (adminRows ?? []).some(
    (r) => r.email.trim().toLowerCase() === email.toLowerCase()
  );
  if (isInAllowlist) bad("test kullanıcısı allowlist'te — test geçersiz");
  else ok("allowlist'te DEĞİL (yönetici değil)");

  // --- 2. Gerçek oturum aç ---
  console.log("\n2) Oturum");
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr || !signIn.session) {
    bad(`giriş yapılamadı: ${signInErr?.message}`);
    process.exit(1);
  }
  ok("e-posta + şifre ile giriş yapıldı");

  // @supabase/ssr oturumu base64 önekli JSON olarak tek çerezde tutuyor.
  const cookieName = `sb-${projectRef}-auth-token`;
  const cookieValue =
    "base64-" + Buffer.from(JSON.stringify(signIn.session), "utf8").toString("base64url");
  const cookie = `${cookieName}=${cookieValue}`;

  async function fetchAs(path) {
    const res = await fetch(BASE + path, { headers: { cookie }, redirect: "manual" });
    return { status: res.status, location: res.headers.get("location") ?? "" };
  }

  // Çerezin gerçekten tanındığını doğrula: tanınmıyorsa aşağıdaki /admin
  // testi yanlış sebepten geçer (oturumsuz sanıldığı için).
  const profil = await fetchAs("/profil");
  if (profil.status === 200) {
    ok("oturum tanındı — /profil açılıyor");
  } else {
    bad(
      `oturum TANINMADI (/profil → ${profil.status} ${profil.location}). ` +
        "Aşağıdaki /admin testi anlamsız olur."
    );
  }

  // --- 3. ASIL TEST: normal kullanıcı /admin'e girebiliyor mu? ---
  console.log("\n3) Yetki sınırı");
  const adminPaths = [
    "/admin",
    "/admin/early-access",
    "/admin/blog",
    "/admin/comments",
    "/admin/admins",
    "/admin/projects",
  ];
  for (const path of adminPaths) {
    const res = await fetchAs(path);
    if (res.status === 200) {
      bad(`GÜVENLİK AÇIĞI: normal kullanıcı ${path} sayfasına GİRDİ (200)`);
    } else if (res.location.includes("/giris")) {
      ok(`${path} → engellendi (${res.status} → giriş)`);
    } else {
      bad(`${path} → beklenmeyen yanıt: ${res.status} ${res.location}`);
    }
  }

  // CSV dışa aktarımı da yönetici gerektiriyor.
  const csv = await fetch(BASE + "/api/admin/early-access-export", {
    headers: { cookie },
    redirect: "manual",
  });
  if (csv.status === 401) ok("/api/admin/early-access-export → 401");
  else bad(`CSV ucu korunmuyor: ${csv.status}`);

  // --- 4. Kullanıcı kendi sayfalarına erişebiliyor mu? ---
  console.log("\n4) Kendi alanı");
  for (const path of ["/profil", "/profil/ayarlar"]) {
    const res = await fetchAs(path);
    if (res.status === 200) ok(`${path} → açılıyor`);
    else bad(`${path} → ${res.status} ${res.location}`);
  }

  // --- 5. Girişliyken giriş/kayıt sayfaları ---
  console.log("\n5) Girişliyken yönlendirme");
  for (const path of ["/giris", "/kayit"]) {
    const res = await fetchAs(path);
    if (res.status === 307 || res.status === 302) ok(`${path} → zaten girişli, yönlendirildi`);
    else bad(`${path} → ${res.status} (yönlendirme bekleniyordu)`);
  }

  // --- 6. Açık yönlendirme ---
  console.log("\n6) Açık yönlendirme koruması");
  const evil = await fetch(`${BASE}/auth/callback?next=https://evil.com&code=sahte`, {
    redirect: "manual",
  });
  const evilLoc = evil.headers.get("location") ?? "";
  if (evilLoc.includes("evil.com")) bad(`dış adrese yönlendirdi: ${evilLoc}`);
  else ok("dış adrese yönlendirmiyor");
} finally {
  await cleanup();
}

console.log(
  process.exitCode ? "\n❌ BAŞARISIZ — yukarıdaki bulgulara bak.\n" : "\n✅ Tüm güvenlik testleri geçti.\n"
);
