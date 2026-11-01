-- Optional: banner & settings for classroom hub (run di Supabase SQL editor)
create table if not exists public.classroom_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table public.classroom_settings enable row level security;

drop policy if exists "classroom_settings_read" on public.classroom_settings;
create policy "classroom_settings_read" on public.classroom_settings
  for select using (true);

drop policy if exists "classroom_settings_write" on public.classroom_settings;
create policy "classroom_settings_write" on public.classroom_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage: buat bucket public "classroom-assets" (atau pakai chat-images yang sudah ada)
