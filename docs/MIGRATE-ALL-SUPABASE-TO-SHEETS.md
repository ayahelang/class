# Migrasi seluruh data Supabase → Google Sheet (Class)

Mode Class memakai **Google Sheet + Apps Script** sebagai database primer.
Setiap tabel disimpan di tab Sheet dengan kolom: `id | json | updated_at`.

## Tabel di database (hasil inspeksi Anda)

| Tab Sheet (usulan) | Tabel Supabase |
|--------------------|----------------|
| `ai_skills` | `gallery_ai_skills` |
| `alumni` | `gallery_alumni` |
| `angkatan` | `gallery_angkatan` |
| `announcement_reads` | `gallery_announcement_reads` |
| `announcements` | `gallery_announcements` |
| `app_settings` | `gallery_app_settings` |
| `attendance_records` | `gallery_attendance_records` |
| `attendance_sessions` | `gallery_attendance_sessions` |
| `chat_messages` | `gallery_chat` |
| `chat_reactions` | `gallery_chat_reactions` |
| `chat_rooms` | `gallery_chat_rooms` |
| `content_snapshots` | `gallery_content_snapshots` |
| `designs` | `gallery_designs` |
| `events` | `gallery_events` |
| `profiles` | `gallery_profiles` |
| `reactions` | `gallery_reactions` |
| `refleksi` | `gallery_refleksi` |
| `settings` | `gallery_settings` |
| `skills_meta` | `gallery_skills_meta` |
| `student_aliases` | `gallery_student_aliases` |
| `video_categories` | `gallery_video_categories` |
| `videos` | `gallery_videos` |
| `websites` | `gallery_websites` |
| `_meta` | (pengaturan mode Class di Sheet) |

## Cek ulang daftar tabel

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE 'gallery_%'
ORDER BY table_name;
```

## Pola export aman (wajib)

1. Cek tabel ada
2. Cek tabel punya kolom
3. Export `to_jsonb(t)` — **tidak menebak nama kolom**

Hasil: kolom `row_json`. Download JSON → normalisasi ke array of objects (wajib ada `id`) → import lewat `tools/data-migrate.html`.

```js
// Normalisasi di console browser bila perlu
const raw = /* paste hasil download */;
const rows = raw.map(r => r.row_json || r);
copy(JSON.stringify(rows));
```

---

## SQL export — semua tabel

### gallery_ai_skills → `ai_skills`

```sql
/* ============================================================
   PAKET EXPORT: gallery_ai_skills
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_ai_skills'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_ai_skills tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_ai_skills'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_ai_skills ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_ai_skills AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_alumni → `alumni`

```sql
/* ============================================================
   PAKET EXPORT: gallery_alumni
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_alumni'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_alumni tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_alumni'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_alumni ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_alumni AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_angkatan → `angkatan`

```sql
/* ============================================================
   PAKET EXPORT: gallery_angkatan
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_angkatan'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_angkatan tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_angkatan'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_angkatan ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_angkatan AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_announcement_reads → `announcement_reads`

```sql
/* ============================================================
   PAKET EXPORT: gallery_announcement_reads
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_announcement_reads'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_announcement_reads tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_announcement_reads'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_announcement_reads ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_announcement_reads AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_announcements → `announcements`

```sql
/* ============================================================
   PAKET EXPORT: gallery_announcements
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_announcements'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_announcements tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_announcements'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_announcements ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_announcements AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_app_settings → `app_settings`

```sql
/* ============================================================
   PAKET EXPORT: gallery_app_settings
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_app_settings'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_app_settings tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_app_settings'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_app_settings ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_app_settings AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_attendance_records → `attendance_records`

```sql
/* ============================================================
   PAKET EXPORT: gallery_attendance_records
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_attendance_records'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_attendance_records tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_attendance_records'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_attendance_records ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_attendance_records AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_attendance_sessions → `attendance_sessions`

```sql
/* ============================================================
   PAKET EXPORT: gallery_attendance_sessions
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_attendance_sessions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_attendance_sessions tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_attendance_sessions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_attendance_sessions ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_attendance_sessions AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_chat → `chat_messages`

```sql
/* ============================================================
   PAKET EXPORT: gallery_chat
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_chat'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_chat tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_chat'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_chat ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_chat AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_chat_reactions → `chat_reactions`

```sql
/* ============================================================
   PAKET EXPORT: gallery_chat_reactions
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_chat_reactions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_chat_reactions tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_chat_reactions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_chat_reactions ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_chat_reactions AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_chat_rooms → `chat_rooms`

```sql
/* ============================================================
   PAKET EXPORT: gallery_chat_rooms
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_chat_rooms'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_chat_rooms tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_chat_rooms'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_chat_rooms ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_chat_rooms AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_content_snapshots → `content_snapshots`

```sql
/* ============================================================
   PAKET EXPORT: gallery_content_snapshots
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_content_snapshots'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_content_snapshots tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_content_snapshots'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_content_snapshots ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_content_snapshots AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_designs → `designs`

```sql
/* ============================================================
   PAKET EXPORT: gallery_designs
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_designs'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_designs tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_designs'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_designs ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_designs AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_events → `events`

```sql
/* ============================================================
   PAKET EXPORT: gallery_events
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_events'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_events tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_events'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_events ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_events AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_profiles → `profiles`

```sql
/* ============================================================
   PAKET EXPORT: gallery_profiles
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_profiles'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_profiles tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_profiles'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_profiles ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_profiles AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_reactions → `reactions`

```sql
/* ============================================================
   PAKET EXPORT: gallery_reactions
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_reactions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_reactions tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_reactions'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_reactions ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_reactions AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_refleksi → `refleksi`

```sql
/* ============================================================
   PAKET EXPORT: gallery_refleksi
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_refleksi'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_refleksi tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_refleksi'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_refleksi ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_refleksi AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_settings → `settings`

```sql
/* ============================================================
   PAKET EXPORT: gallery_settings
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_settings'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_settings tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_settings'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_settings ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_settings AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_skills_meta → `skills_meta`

```sql
/* ============================================================
   PAKET EXPORT: gallery_skills_meta
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_skills_meta'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_skills_meta tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_skills_meta'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_skills_meta ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_skills_meta AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_student_aliases → `student_aliases`

```sql
/* ============================================================
   PAKET EXPORT: gallery_student_aliases
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_student_aliases'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_student_aliases tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_student_aliases'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_student_aliases ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_student_aliases AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_video_categories → `video_categories`

```sql
/* ============================================================
   PAKET EXPORT: gallery_video_categories
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_video_categories'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_video_categories tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_video_categories'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_video_categories ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_video_categories AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_videos → `videos`

```sql
/* ============================================================
   PAKET EXPORT: gallery_videos
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_videos'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_videos tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_videos'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_videos ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_videos AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```

### gallery_websites → `websites`

```sql
/* ============================================================
   PAKET EXPORT: gallery_websites
   ============================================================ */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'gallery_websites'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_websites tidak ada.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'gallery_websites'
  ) THEN
    RAISE EXCEPTION 'GAGAL: tabel gallery_websites ada tetapi tidak punya kolom.';
  END IF;
END $$;

SELECT to_jsonb(t) AS row_json
FROM gallery_websites AS t
ORDER BY to_jsonb(t)->>'id' NULLS LAST;
```


---

## Urutan migrasi disarankan

1. `angkatan` → `alumni` → `student_aliases`
2. `websites` → `videos` → `video_categories` → `designs`
3. `announcements` → `announcement_reads`
4. `attendance_sessions` → `attendance_records`
5. `chat_rooms` → `chat_messages` → `chat_reactions`
6. `profiles` → `reactions` → `events`
7. `settings` → `app_settings` → `skills_meta` → `ai_skills` → `refleksi` → `content_snapshots`
8. `_meta` (opsional di Sheet)

## Import

1. Export paket SQL di atas → Download JSON
2. Normalisasi ke **array of objects** (ada `id`)
3. Buka `tools/data-migrate.html`
4. Pilih tab, tempel JSON, password admin → **Import bulk**
5. Status: **record ke-X dari total Y** per batch


## Pembuatan tab Sheet otomatis

Backend GAS (`scripts/ClassSheetsBackend.gs`) memakai `ensureTab_()`:

- Jika tab **belum ada** di spreadsheet → **dibuat otomatis** dengan header `id | json | updated_at`
- Jika tab sudah ada → dipakai apa adanya

Syarat agar import tidak ditolak:

1. Nama tab ada di whitelist `TABS` di `ClassSheetsBackend.gs` (sudah dilengkapi 23+ tab)
2. **Deploy ulang** Web App GAS (New version) setelah update `ClassSheetsBackend.gs`
3. Import lewat `tools/data-migrate.html` dengan password admin

Jadi Anda **tidak perlu** membuat 23 tab manual di Google Sheet — cukup deploy GAS terbaru, lalu import per tabel; tab baru akan muncul sendiri.

## Setelah migrasi

1. `data/db-backend-config.js` → `primary: "sheets"`, `allowSupabase: false`
2. Uji fitur Class
3. Media tetap URL lama selama bucket publik

## Catatan

- Jangan menebak kolom — selalu `to_jsonb(t)`
- Batch 50–200 baris agar tidak timeout GAS
- Pastikan tab Sheet sudah dibuat di spreadsheet (nama sesuai dropdown tool)
- Backend GAS (`importBulk`) harus mengizinkan nama tab baru; jika ditolak, perluas whitelist di `ClassSheetsBackend.gs`
