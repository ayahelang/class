-- =============================================================================
-- Silverhawk Classroom — Fase 1 (Course/Modul/Materi/Progress) + Fase 2 (Tugas/Nilai)
-- Jalankan di Supabase SQL Editor. Aman diulang (IF NOT EXISTS).
-- Tidak mengubah tabel gallery_* yang sudah ada.
-- =============================================================================

-- 1) Course (mata pelajaran / kelas online)
create table if not exists classroom_courses (
  id uuid primary key default gen_random_uuid(),
  code text,                          -- mis. SMM-2026
  title text not null,
  description text default '',
  cover_url text default '',
  angkatan_id uuid references gallery_angkatan(id) on delete set null,
  teacher_user_id uuid,               -- auth user pengajar
  teacher_name text default '',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cc_active_idx on classroom_courses (active, sort_order);

-- 2) Enrollment (siapa ikut course)
create table if not exists classroom_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references classroom_courses(id) on delete cascade,
  user_id uuid,                       -- login Google
  student_name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','assistant')),
  active boolean not null default true,
  created_at timestamptz default now(),
  unique (course_id, user_id)
);

create index if not exists ce_course_idx on classroom_enrollments (course_id);
create index if not exists ce_user_idx on classroom_enrollments (user_id);

-- 3) Modul (urutan di dalam course)
create table if not exists classroom_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references classroom_courses(id) on delete cascade,
  title text not null,
  description text default '',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists cm_course_idx on classroom_modules (course_id, sort_order);

-- 4) Materi (item di modul: teks, link, embed, pdf url)
create table if not exists classroom_materials (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references classroom_modules(id) on delete cascade,
  title text not null,
  body text default '',               -- markdown/teks
  material_type text not null default 'text'
    check (material_type in ('text','link','video','pdf','embed')),
  content_url text default '',        -- youtube, drive, pdf public url
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists cmat_module_idx on classroom_materials (module_id, sort_order);

-- 5) Progress baca materi (Fase 1)
create table if not exists classroom_progress (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references classroom_materials(id) on delete cascade,
  user_id uuid,
  student_name text default '',
  completed boolean not null default true,
  completed_at timestamptz default now(),
  unique (material_id, user_id)
);

create index if not exists cp_user_idx on classroom_progress (user_id);

-- 6) Tugas (Fase 2)
create table if not exists classroom_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references classroom_courses(id) on delete cascade,
  module_id uuid references classroom_modules(id) on delete set null,
  title text not null,
  description text default '',
  max_score numeric(6,2) not null default 100,
  due_at timestamptz,                 -- deadline
  allow_late boolean not null default true,
  submission_type text not null default 'link'
    check (submission_type in ('link','text','file_url')), -- file_url = link ke Drive/dll (hemat storage)
  published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ca_course_idx on classroom_assignments (course_id);

-- 7) Pengumpulan tugas
create table if not exists classroom_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references classroom_assignments(id) on delete cascade,
  user_id uuid,
  student_name text not null default '',
  body text default '',               -- teks jawaban
  link_url text default '',           -- URL karya / Drive
  submitted_at timestamptz default now(),
  is_late boolean not null default false,
  status text not null default 'submitted'
    check (status in ('draft','submitted','returned','graded'))
);

create unique index if not exists cs_one_per_user
  on classroom_submissions (assignment_id, user_id)
  where user_id is not null;

create index if not exists cs_assignment_idx on classroom_submissions (assignment_id);

-- 8) Nilai + komentar pengajar
create table if not exists classroom_grades (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references classroom_submissions(id) on delete cascade,
  score numeric(6,2),
  max_score numeric(6,2) not null default 100,
  feedback text default '',
  graded_by uuid,
  graded_by_name text default '',
  graded_at timestamptz default now(),
  unique (submission_id)
);

-- RLS longgar dulu (sama pola gallery_*) — kunci lebih ketat bisa menyusul
alter table classroom_courses enable row level security;
alter table classroom_enrollments enable row level security;
alter table classroom_modules enable row level security;
alter table classroom_materials enable row level security;
alter table classroom_progress enable row level security;
alter table classroom_assignments enable row level security;
alter table classroom_submissions enable row level security;
alter table classroom_grades enable row level security;

drop policy if exists cc_all on classroom_courses;
create policy cc_all on classroom_courses for all using (true) with check (true);
drop policy if exists ce_all on classroom_enrollments;
create policy ce_all on classroom_enrollments for all using (true) with check (true);
drop policy if exists cm_all on classroom_modules;
create policy cm_all on classroom_modules for all using (true) with check (true);
drop policy if exists cmat_all on classroom_materials;
create policy cmat_all on classroom_materials for all using (true) with check (true);
drop policy if exists cp_all on classroom_progress;
create policy cp_all on classroom_progress for all using (true) with check (true);
drop policy if exists ca_all on classroom_assignments;
create policy ca_all on classroom_assignments for all using (true) with check (true);
drop policy if exists cs_all on classroom_submissions;
create policy cs_all on classroom_submissions for all using (true) with check (true);
drop policy if exists cg_all on classroom_grades;
create policy cg_all on classroom_grades for all using (true) with check (true);

-- Verifikasi
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'classroom_%'
order by table_name;
