/**
 * Blog sistemi: demo içerik + uçtan uca doğrulama.
 *
 * supabase/schema.sql'deki posts/comments bölümü SQL Editor'da çalıştırıldıktan
 * SONRA çalıştır:
 *
 *   node scripts/blog-seed-verify.mjs          → doğrula + demo yazı oluştur
 *   node scripts/blog-seed-verify.mjs --clean  → demo içeriği sil
 *
 * Demo yazı, SEO rehberindeki üç kritik formatı da kullanıyor: answer-first
 * özet, karşılaştırma tablosu ve FAQ. Böylece yapılandırılmış verinin gerçekten
 * üretildiği görülebiliyor.
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

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SLUG = "whatsapp-talep-takibi";
const clean = process.argv.includes("--clean");

const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  process.exitCode = 1;
};

// --- 1. Tablolar var mı ---
console.log("\n1) Şema");
for (const table of ["posts", "comments"]) {
  const { error } = await supabase.from(table).select("id").limit(1);
  if (error) {
    bad(`${table} tablosu yok — supabase/schema.sql'i SQL Editor'da çalıştır (${error.code})`);
    process.exit(1);
  }
  ok(`${table} tablosu var`);
}

if (clean) {
  const { data } = await supabase.from("posts").delete().eq("slug", SLUG).select("slug");
  console.log(`\nDemo içerik silindi: ${data?.length ?? 0} yazı (yorumları cascade ile gitti)\n`);
  process.exit(0);
}

// --- 2. Demo yazı ---
console.log("\n2) Demo yazı");
let n = 0;
const id = () => `seed${(++n).toString(36)}`;

const blocks = [
  {
    id: id(),
    type: "tldr",
    text: "Emlak ofislerine WhatsApp'tan gelen taleplerin büyük kısmı elle takip edildiği için kayboluyor. Lupra bu talepleri otomatik yakalıyor, müşteriye saniyeler içinde ilk dönüşü yapıyor ve hepsini tek listede topluyor — danışman yalnızca devraldığı yerden devam ediyor.",
  },
  {
    id: id(),
    type: "text",
    markdown:
      "## Sorun tek bir cümlede\n\nTalep WhatsApp'a düşüyor, danışman meşgulse görülmüyor, iki saat sonra müşteri başka ofise gidiyor. Kayıp, ilgisizlikten değil **takip edilemeyen bir kanaldan** kaynaklanıyor.",
  },
  {
    id: id(),
    type: "table",
    caption: "Elle takip ile Lupra'nın karşılaştırması",
    headers: ["", "Elle takip", "Lupra ile"],
    rows: [
      ["İlk dönüş süresi", "Saatler", "Saniyeler"],
      ["Kaçan talep", "Ölçülemiyor", "Sıfıra yakın"],
      ["Talep kaydı", "Danışmanın telefonunda", "Tek panelde"],
      ["Gece gelen talep", "Sabah görülüyor", "Anında karşılanıyor"],
    ],
  },
  {
    id: id(),
    type: "faq",
    items: [
      {
        question: "Lupra müşteriyle danışman gibi mi konuşuyor?",
        answer:
          "Hayır. Lupra talebi karşılar, gerekli bilgileri toplar ve danışmana devreder. Fiyat ve pazarlık gibi kararlar her zaman danışmanda kalır.",
      },
      {
        question: "Mevcut WhatsApp numaramız değişiyor mu?",
        answer: "Hayır, ofisin kullandığı numara aynı kalır. Lupra o numaranın arkasında çalışır.",
      },
      {
        question: "Kurulum ne kadar sürüyor?",
        answer:
          "Tipik bir emlak ofisinde yarım gün. Ofisin kendi süreçlerine göre yanıt akışının ayarlanması bir hafta kadar sürebilir.",
      },
    ],
  },
  {
    id: id(),
    type: "cta",
    label: "Erken erişime katıl",
    href: "/#early-access",
    note: "Ofisinde denemek istersen listeye yazıl",
  },
];

const words = blocks
  .map((b) =>
    b.type === "tldr" ? b.text
      : b.type === "text" ? b.markdown
      : b.type === "faq" ? b.items.map((i) => `${i.question} ${i.answer}`).join(" ")
      : b.type === "table" ? [...b.headers, ...b.rows.flat()].join(" ")
      : ""
  )
  .join(" ")
  .split(/\s+/)
  .filter(Boolean).length;

const row = {
  slug: SLUG,
  title: "WhatsApp'tan gelen talepleri kaybetmeyi nasıl bıraktık",
  excerpt:
    "Emlak ofislerine WhatsApp'tan gelen taleplerin yarısı elle takip edildiği için kayboluyor. Lupra bunları otomatik yakalıyor ve tek listede topluyor.",
  blocks,
  tags: ["otomasyon", "whatsapp", "emlak"],
  status: "published",
  published_at: new Date().toISOString(),
  reading_minutes: Math.max(1, Math.round(words / 200)),
  updated_at: new Date().toISOString(),
};

const { data: existing } = await supabase.from("posts").select("id").eq("slug", SLUG).maybeSingle();
const result = existing
  ? await supabase.from("posts").update(row).eq("id", existing.id).select("id, slug")
  : await supabase.from("posts").insert(row).select("id, slug");

if (result.error) {
  bad(`yazı yazılamadı: ${result.error.message}`);
  process.exit(1);
}
const postId = result.data[0].id;
ok(`${existing ? "güncellendi" : "oluşturuldu"}: /blog/${SLUG} (${blocks.length} blok)`);

// --- 3. Demo yorumlar: biri onaylı, biri bekleyen ---
console.log("\n3) Demo yorumlar");
await supabase.from("comments").delete().eq("post_id", postId);
const { error: cErr } = await supabase.from("comments").insert([
  {
    post_id: postId,
    author_name: "Deneme Ziyaretçi",
    body: "Bizim ofiste de aynı sorun var, gece gelen talepler sabaha kadar bekliyor. Erken erişimi bekliyorum.",
    status: "approved",
  },
  {
    post_id: postId,
    author_name: "Onay Bekleyen",
    author_email: "bekleyen@ornek.com",
    body: "Bu yorum ONAYLANMADI — sitede görünmemeli, yalnızca panelde bekliyor olmalı.",
    status: "pending",
  },
]);
if (cErr) bad(`yorumlar yazılamadı: ${cErr.message}`);
else ok("1 onaylı + 1 bekleyen yorum eklendi");

// --- 4. HTTP doğrulaması ---
console.log("\n4) Sayfa doğrulaması (localhost:3000)");
const base = "http://localhost:3000";

async function check(path, test, label) {
  try {
    const res = await fetch(base + path);
    const text = await res.text();
    const passed = await test(res, text);
    if (passed) ok(`${path} — ${label}`);
    else bad(`${path} — ${label}`);
    return text;
  } catch {
    bad(`${path} — sunucuya ulaşılamadı (npm run dev çalışıyor mu?)`);
    return "";
  }
}

await check("/blog", (r, t) => r.status === 200 && t.includes(row.title), "yazı listede görünüyor");

const postHtml = await check(
  `/blog/${SLUG}`,
  (r, t) => r.status === 200 && t.includes("Kısaca"),
  "yazı açılıyor, TL;DR bloğu render ediliyor"
);

if (postHtml) {
  const checks = [
    ["BlogPosting", "BlogPosting yapılandırılmış verisi"],
    ["FAQPage", "FAQPage yapılandırılmış verisi"],
    ["BreadcrumbList", "BreadcrumbList yapılandırılmış verisi"],
    ["Elle takip", "karşılaştırma tablosu"],
    ["Deneme Ziyaretçi", "onaylı yorum görünüyor"],
  ];
  for (const [needle, label] of checks) {
    if (postHtml.includes(needle)) ok(label);
    else bad(label);
  }
  // En kritik kontrol: onaysız yorum SIZMAMALI.
  if (postHtml.includes("Onay Bekleyen") || postHtml.includes("ONAYLANMADI")) {
    bad("ONAYSIZ YORUM SIZDI — moderasyon çalışmıyor!");
  } else {
    ok("onaysız yorum sitede görünmüyor");
  }

  // JSON-LD gerçekten ayrıştırılabiliyor mu?
  const scripts = [...postHtml.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  let valid = 0;
  for (const [, json] of scripts) {
    try {
      JSON.parse(json.replace(/\\u003c/g, "<"));
      valid++;
    } catch {
      /* sayma */
    }
  }
  if (valid === scripts.length && valid >= 3) ok(`${valid} JSON-LD bloğu geçerli`);
  else bad(`JSON-LD sorunlu (${valid}/${scripts.length} geçerli)`);
}

await check("/blog/rss.xml", (r, t) => r.status === 200 && t.includes(SLUG), "RSS beslemesinde var");
await check("/sitemap.xml", (r, t) => r.status === 200 && t.includes(`/blog/${SLUG}`), "sitemap'te var");

console.log(
  process.exitCode ? "\n❌ Bazı kontroller başarısız — yukarıya bak.\n" : "\n✅ Tüm kontroller geçti.\n"
);
