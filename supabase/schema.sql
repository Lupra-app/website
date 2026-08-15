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
