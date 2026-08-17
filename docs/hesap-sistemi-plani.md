# Hesap Sistemi Planı — GitHub + E-posta/Şifre + Profil

## Neden bu bir mimari değişiklik

Sitede şu an **tek bir kullanıcı sınıfı** var: yönetici. `/login` yönetici
girişi, `/auth/callback` de allowlist'te olmayan **herkesi anında çıkış
yaptırıyor** (`src/app/auth/callback/route.ts:37-40`). Yani bugün public kayıt
eklenirse her yeni kullanıcı kaydolduğu saniye atılır.

Bu iş, sisteme ikinci bir kullanıcı sınıfı ekliyor: **normal kullanıcı**.
Yetkilendirme artık iki kademeli olacak — "oturum açmış mı" ve "yönetici mi"
birbirinden ayrı sorular.

## Mevcut durum (Supabase'den okundu, tahmin değil)

| Ayar | Değer | Sonuç |
|---|---|---|
| `disable_signup` | `false` | Kayıt zaten açık |
| `mailer_autoconfirm` | `false` | **Kayıtta doğrulama maili gidiyor** |
| Aktif sağlayıcılar | `google`, `email` | **GitHub etkin DEĞİL** |

## Senin yapman gereken dış kurulum

1. **GitHub OAuth uygulaması** — github.com/settings/developers → New OAuth App.
   Callback URL: `https://<proje-ref>.supabase.co/auth/v1/callback`.
   Client ID + secret'ı Supabase → Authentication → Providers → GitHub'a gir.
2. **SQL** — `supabase/schema.sql`'deki `profiles` bölümünü çalıştır.
3. **Üretim için SMTP** (sonra) — Supabase'in yerleşik maili saatte birkaç
   mesajla sınırlı. Gerçek kullanıcı akışı için kendi SMTP'ni bağlaman gerekir.

## Kararlar ve gerekçeleri

**Tek giriş sayfası, iki yetki kademesi.** `/giris` ve `/kayit` herkes için.
Yönetici olup olmadığın `admin_users` allowlist'inden belirlenir; ayrı bir
yönetici giriş sayfası yok. İki ayrı giriş akışı yaşatmak, ikisinden birinin
güvenlik düzeltmesini almayı unutmak demek. `/login` geriye dönük uyumluluk
için `/giris`e yönlendirilecek.

**`/auth/callback` artık kimseyi çıkış yaptırmıyor.** Bunun yerine: oturumu
açar, profili oluşturur, `next` parametresine yönlendirir (varsayılan
`/profil`). Yönetici yetkisi `/admin`'e girişte `requireAdmin()` ile ayrıca
kontrol edilmeye devam eder — o kapı hiç gevşemiyor.

**E-posta onayı açık kalıyor.** Kapatmak spam hesapları davet eder. Karşılığı:
kayıt akışı "e-postana bak" ekranıyla bitiyor, oturum hemen açılmıyor.

**Profil verisi için ayrı `profiles` tablosu.** Supabase `auth.users` tablosuna
uygulama alanı eklenemez. `profiles`, `auth.users.id`'ye foreign key ile bağlı.

**Yetki modeli mevcut mimariyle tutarlı: service-role + DAL.** Tablolarda RLS
açık, policy yok; her sorgu `requireUser()`'dan gelen oturum kimliğiyle
filtreleniyor. İstemciden gelen bir kullanıcı kimliğine ASLA güvenilmiyor.
Bu, projenin geri kalanıyla aynı kalıp (bkz. CLAUDE.md).

**Avatar yüklemesi mevcut altyapıyı kullanıyor** ama yeni bir yetki kapısı
gerekiyor: `createUploadTicket` şu an `requireAdmin()` çağırıyor, normal
kullanıcı avatar yükleyemez. Kullanıcı seviyesinde ayrı bir bilet fonksiyonu
yazılacak — yalnızca görsel, küçük boyut sınırı, kendi klasörüne.

## Veri modeli

**`profiles`** — id (auth.users FK), display_name, avatar_url, bio,
newsletter_opt_in, created_at, updated_at.

Profil, kullanıcı ilk giriş yaptığında otomatik oluşturulur (callback'te ve
`requireUser()` içinde upsert) — böylece "profili olmayan kullanıcı" durumu
hiç oluşmaz.

## Kapsam

| # | Parça |
|---|---|
| 1 | `profiles` tablosu + şema |
| 2 | DAL: `getUserSession()`, `requireUser()`, profil upsert |
| 3 | `/kayit` — GitHub + Google + e-posta/şifre |
| 4 | `/giris` — aynı üç yöntem + "şifremi unuttum" |
| 5 | `/auth/callback` yeniden yazımı (çıkış yaptırma kaldırılıyor) |
| 6 | E-posta onay bekleme + yeniden gönderme ekranı |
| 7 | Şifre sıfırlama akışı (`/sifre-sifirla` + `/sifre-yenile`) |
| 8 | `/profil` — özet |
| 9 | `/profil/ayarlar` — ad, avatar, bio, bülten, şifre, e-posta, bağlı hesaplar, hesap silme |
| 10 | Kullanıcı menüsü (site başlığında) |

## Güvenlik kontrol listesi

- `/admin` yalnızca allowlist'e açık kalmalı — yeni kullanıcı asla giremez
- Her profil sorgusu oturum kimliğiyle filtreli; istemci kimliği kabul edilmez
- Hesap silme yalnızca kendi hesabı için; service-role çağrısı öncesi eşleşme
- Avatar yükleme: yalnızca görsel MIME, boyut sınırı, kullanıcı klasörü
- Açık yönlendirme: `next` parametresi yalnızca site-içi göreli yol
- Şifre en az 8 karakter; Supabase'in kendi hız sınırı devrede

## Doğrulama

Her parçadan sonra `npm run build` + `npx eslint .`. Bitişte: yeni kullanıcı
`/admin`'e giremiyor, profil verisi başka kullanıcıya sızmıyor, e-posta onayı
olmadan oturum açılmıyor, mobilde yatay kaydırma yok, konsol temiz.
