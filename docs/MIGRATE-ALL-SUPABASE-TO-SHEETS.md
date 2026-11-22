# Migrasi seluruh data Supabase → Google Sheet (Class)

Mode Class memakai **Google Sheet + Apps Script** sebagai database primer.  
Setiap tabel disimpan di tab Sheet dengan kolom: `id | json | updated_at`.

## Tabel Sheet yang didukung backend

| Tab Sheet | Sumber Supabase (perkiraan) |
|-----------|-----------------------------|
| `angkatan` | `gallery_angkatan` |
| `alumni` | `gallery_alumni` |
| `websites` | `gallery_websites` |
| `videos` | `gallery_videos` |
| `designs` | `gallery_designs` |
| `announcements` | `gallery_announcements` |
| `attendance_sessions` | `gallery_attendance_sessions` |
| `attendance_records` | `gallery_attendance_records` |
| `chat_rooms` | `gallery_chat_rooms` |
| `chat_messages` | `gallery_chat` |
| `profiles` | `gallery_profiles` |
| `reactions` | `gallery_reactions` |
| `events` | `gallery_events` |
| `settings` | `gallery_settings` |
| `announcement_reads` | `gallery_announcement_reads` |
| `_meta` | pengaturan / mode |

## Cara cek semua tabel di database

Jalankan di **SQL Editor** Supabase:

```sql
-- Semua tabel di schema public (urut nama)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Hanya yang berawalan `gallery_`:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE 'gallery_%'
ORDER BY table_name;
```

## Pola export aman (wajib dipakai)

Setiap paket export:

1. **Cek tabel ada**  
2. **Cek tabel punya kolom**  
3. **Export** dengan `to_jsonb(t)` — tidak menebak nama kolom  

Hasil: satu kolom `row_json`. Di hasil query Supabase → **Download as JSON**, lalu di tool migrasi map `row_json` menjadi objek baris (atau tempel array objek yang sudah di-expand).

> Tip: di hasil SQL Editor, unduh JSON lalu pastikan setiap elemen punya field `id` (dari isi `row_json`). Tool `tools/data-migrate.html` menerima **array of objects** (bukan wrapper `row_json` saja).  
> Jika download masih berbentuk `{ "row_json": { ... } }`, normalisasi dulu di console:
> ```js
> const raw = /* paste array dari download */;
> const rows = raw.map(r => r.row_json || r);
> copy(JSON.stringify(rows));
> ```

---

## SQL export (jalankan satu paket per tabel)

### 1) gallery_angkatan → tab `angkatan`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_angkatan tidak ada. Cek nama tabel di Table Editor.';
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

### 2) gallery_alumni → tab `alumni`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_alumni tidak ada. Cek nama tabel di Table Editor.';
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

### 3) gallery_websites → tab `websites`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_websites tidak ada. Cek nama tabel di Table Editor.';
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

### 4) gallery_videos → tab `videos`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_videos tidak ada. Cek nama tabel di Table Editor.';
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

### 5) gallery_designs → tab `designs`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_designs tidak ada. Cek nama tabel di Table Editor.';
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

### 6) gallery_announcements → tab `announcements`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_announcements tidak ada. Cek nama tabel di Table Editor.';
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

### 7) gallery_attendance_sessions → tab `attendance_sessions`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_attendance_sessions tidak ada. Cek nama di Table Editor (bisa beda ejaan).';
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

### 8) gallery_attendance_records → tab `attendance_records`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_attendance_records tidak ada. Cek nama di Table Editor.';
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

### 9) gallery_chat_rooms → tab `chat_rooms`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_chat_rooms tidak ada. Cek nama tabel di Table Editor.';
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

### 10) gallery_chat → tab `chat_messages`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_chat tidak ada. Cek nama tabel di Table Editor.';
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

### 11) gallery_profiles → tab `profiles`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_profiles tidak ada. Cek nama tabel di Table Editor.';
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

### 12) gallery_reactions → tab `reactions`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_reactions tidak ada. Cek nama tabel di Table Editor.';
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

### 13) gallery_events → tab `events`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_events tidak ada. Cek nama tabel di Table Editor.';
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

### 14) gallery_settings → tab `settings`

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_settings tidak ada. Cek nama tabel di Table Editor.';
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

### 15) gallery_announcement_reads → tab `announcement_reads` (opsional)

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
    RAISE EXCEPTION 'GAGAL: tabel public.gallery_announcement_reads tidak ada (mungkin belum di-patch).';
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

---

## Urutan migrasi yang disarankan

1. `angkatan`  
2. `alumni`  
3. `websites` + `videos` + `designs`  
4. `announcements` (+ `announcement_reads` bila ada)  
5. `attendance_sessions` → lalu `attendance_records`  
6. `chat_rooms` → lalu `chat_messages`  
7. `profiles`  
8. `reactions` + `events` + `settings`  
9. `_meta` (opsional)

## Import

1. Export SQL di atas → Download JSON  
2. Normalisasi ke **array of objects** (setiap baris punya `id`)  
3. Buka `tools/data-migrate.html`  
4. Pilih tab Sheet, tempel JSON, isi password admin, **Import bulk**  
5. Status menampilkan **record ke-X dari total Y** per batch  

Atau lewat GAS `importBulk` (lihat `scripts/ClassSheetsBackend.gs`).

## Setelah migrasi

1. `data/db-backend-config.js` → `primary: "sheets"`, `allowSupabase: false`  
2. Uji: chat, absensi, pengumuman, gallery, desain  
3. Media (gambar) tetap URL lama selama bucket publik  

## Catatan

- Jangan menebak nama kolom di SQL export — selalu `to_jsonb(t)`  
- Sheet punya batas ukuran; pecah batch **50–200** baris di tool migrasi  
- Chat mode Sheet tidak realtime (polling)  
- Jika paket export RAISE EXCEPTION “tabel tidak ada”, sesuaikan `table_name` dengan hasil query daftar tabel di atas  
