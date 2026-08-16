-- Lupra: erken erişim kayıtları
-- Supabase dashboard → SQL Editor'da bir kere çalıştır.

create table if not exists early_access (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- RLS açık, hiçbir policy yok: sadece service-role key (backend'in
-- kullandığı, tarayıcıya asla gitmeyen anahtar) bu tabloya erişebilir.
-- Panel (G3-4) aynı service-role key üzerinden okuyacak.
alter table early_access enable row level security;

-- ---------------------------------------------------------------------------
-- Kayıt bağlamı: ziyaretçi nereden geldi, neyle geldi.
--
-- IP ADRESİ KASITLI OLARAK SAKLANMIYOR. Sadece ülke kodu tutuluyor ve o da
-- Vercel'in isteğe eklediği x-vercel-ip-country başlığından geliyor; ham IP
-- hiçbir yere yazılmıyor. Ülke kodu tek başına bir kişiyi işaret etmediği
-- için KVKK kapsamında kişisel veri saklama yükümlülüğü doğurmuyor.
--
-- Cihaz/tarayıcı/işletim sistemi user-agent'tan TÜRETİLİYOR; ham user-agent
-- string'i de saklanmıyor (parmak izi çıkarmaya yarayacak kadar ayırt edici).
-- ---------------------------------------------------------------------------
alter table early_access add column if not exists source_referrer text;
alter table early_access add column if not exists utm_source text;
alter table early_access add column if not exists utm_medium text;
alter table early_access add column if not exists utm_campaign text;
alter table early_access add column if not exists device_type text;  -- mobile | tablet | desktop
alter table early_access add column if not exists browser text;
alter table early_access add column if not exists os text;
alter table early_access add column if not exists language text;     -- tr, en, de...
alter table early_access add column if not exists country text;      -- TR, DE... (Vercel başlığı)

-- Davet akışı: erken erişim dalga dalga açılırken kimin nerede olduğunu
-- panelden takip etmek için.
alter table early_access add column if not exists status text not null default 'new';
alter table early_access add column if not exists note text;
alter table early_access add column if not exists status_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'early_access_status_check'
  ) then
    alter table early_access add constraint early_access_status_check
      check (status in ('new', 'invited', 'joined'));
  end if;
end $$;

create index if not exists idx_early_access_status_created_at
  on early_access(status, created_at desc);

-- Admin kullanıcıları: Google OAuth üzerinden giren kişilerin
-- /admin'e erişimini kontrol etmek için. Email adresi unique.
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS açık, yine sadece service-role erişebilir
alter table admin_users enable row level security;

-- E-posta harf duyarlılığı tuzağını DB seviyesinde kapat: Google her zaman
-- küçük harfli adres döndürür, ama tabloya "Umut@gmail.com" yazılırsa
-- allowlist sessizce boşa düşer ve kimse panele giremez. Uygulama da
-- lower() ile sorgular (src/lib/dal.ts), bu index onu garantiye alır.
create unique index if not exists idx_admin_users_email_lower
  on admin_users (lower(email));

-- Son yöneticinin silinmesini engelle. Uygulamada da kontrol var
-- (src/app/admin/admins/actions.ts) ama "say, sonra sil" arasında yarış
-- koşulu var: iki yönetici aynı anda birbirini silerse ikisi de sayımı 2
-- görür. Tek gerçek garanti bu trigger.
create or replace function prevent_last_admin_delete()
returns trigger language plpgsql as $$
begin
  if (select count(*) from admin_users) <= 1 then
    raise exception 'last_admin' using errcode = 'P0001';
  end if;
  return old;
end $$;

drop trigger if exists admin_users_prevent_last_delete on admin_users;
create trigger admin_users_prevent_last_delete
  before delete on admin_users
  for each row execute function prevent_last_admin_delete();

-- BOOTSTRAP: ilk yöneticiyi buradan ekle. Panelde yönetici ekleme ekranı
-- var (/admin/admins) ama oraya girebilmek için zaten yönetici olman
-- gerekiyor — yumurta-tavuk. İlk satır SQL Editor'dan girilir:
--
--   insert into admin_users (email) values (lower('senin@gmail.com'))
--   on conflict (email) do nothing;

-- Audit log: admin panel aktiviteleri (kim, ne zaman, ne yaptı)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null, -- e.g., "view_early_access", "export_csv", "login"
  details jsonb, -- additional context (e.g., record_id, filter_query)
  created_at timestamptz not null default now()
);

-- RLS açık, sadece service-role erişebilir
alter table audit_logs enable row level security;

-- Index: admin_email + created_at için hızlı sorgular
create index if not exists idx_audit_logs_admin_email_created_at
  on audit_logs(admin_email, created_at desc);

-- Projeler (G5 CMS): lupra.app/[slug] altında yayınlanan proje sayfaları.
-- İçerik markdown olarak saklanır, admin panelden düzenlenir.
-- updated_at trigger'la değil, update eden server action tarafından yazılır.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text, -- kart/SEO açıklaması, opsiyonel
  content text not null default '', -- markdown gövde
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS açık, policy yok: diğer tablolar gibi sadece service-role erişir.
-- Public sayfa da server component içinden service-role ile okur.
alter table projects enable row level security;

create index if not exists idx_projects_status_updated_at
  on projects(status, updated_at desc);

-- Blok tabanlı içerik: sayfa artık düz markdown değil, sıralı bloklardan
-- oluşuyor (metin, görsel, galeri, video, 3D model, alıntı, özellikler, CTA).
-- Dizideki sıra sayfadaki sıradır. Şekli src/lib/blocks.ts'te doğrulanıyor —
-- JSONB olarak saklamak, blok tipleri geliştikçe migration gerektirmiyor.
alter table projects add column if not exists blocks jsonb not null default '[]'::jsonb;

-- Kapak görseli: proje kartında ve sosyal medya önizlemesinde (OG) kullanılır.
alter table projects add column if not exists cover_url text;

-- ---------------------------------------------------------------------------
-- Storage: proje medyası (görsel, video, 3D model)
--
-- Dosyalar tarayıcıdan DOĞRUDAN buraya yüklenir; Vercel'e hiç uğramazlar.
-- Sebebi: Vercel'in serverless istek gövdesi 4.5 MB ile sınırlı ve disk
-- kalıcı değil. Sunucu yalnızca kısa ömürlü bir imzalı yükleme izni üretir
-- (src/app/admin/projects/upload-actions.ts).
--
-- Bucket public: proje sayfaları herkese açık, dolayısıyla medyası da öyle.
-- Yazma yetkisi public DEĞİL — yükleme yalnızca imzalı token ile mümkün.
-- ---------------------------------------------------------------------------
-- 50 MB: Supabase'in ücretsiz planında dosya başına izin verilen üst sınır bu.
-- Daha uzun videolar için ya plan yükseltmek ya da videoyu sıkıştırmak gerekir.
insert into storage.buckets (id, name, public, file_size_limit)
values ('project-media', 'project-media', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

-- ---------------------------------------------------------------------------
-- Blog (G6): yazılar + ziyaretçi yorumları
--
-- Yazılar projelerle aynı blok sistemini kullanıyor (blocks JSONB), ama ayrı
-- tabloda: yazının yayın tarihi, okuma süresi, etiketleri ve yorumları var,
-- projenin yok. İkisini tek tabloya sıkıştırmak her iki kavramı da bulanık
-- hâle getirirdi.
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,                                  -- TL;DR + meta description
  cover_url text,
  blocks jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  project_id uuid references projects(id) on delete set null,
  status text not null default 'draft',
  published_at timestamptz,
  reading_minutes int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_status_check') then
    alter table posts add constraint posts_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

alter table posts enable row level security;

create index if not exists idx_posts_status_published_at
  on posts(status, published_at desc);

-- Ziyaretçi yorumları.
--
-- Girişsiz yorum kaçınılmaz olarak spam çeker, bu yüzden her yorum 'pending'
-- olarak düşer ve panelden onaylanmadan sitede GÖRÜNMEZ.
--
-- author_email isteğe bağlı ve hiçbir zaman yayınlanmaz — yalnızca panelde,
-- yoruma geri dönebilmek için. IP saklanmıyor; erken erişimdeki kararla aynı
-- şekilde yalnızca ülke kodu tutuluyor.
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_name text not null,
  author_email text,
  body text not null,
  status text not null default 'pending',
  country text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'comments_status_check') then
    alter table comments add constraint comments_status_check
      check (status in ('pending', 'approved', 'spam'));
  end if;
end $$;

alter table comments enable row level security;

create index if not exists idx_comments_post_status
  on comments(post_id, status, created_at desc);
create index if not exists idx_comments_status_created
  on comments(status, created_at desc);
