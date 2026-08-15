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
