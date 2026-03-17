-- Supabase에서 실행: SQL Editor에 붙여넣기
create table if not exists face_users (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null,
  descriptor  float8[]    not null,   -- 128-dim face embedding
  created_at  timestamptz default now()
);

-- (선택) RLS 비활성화 — 개발용
alter table face_users disable row level security;
