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
