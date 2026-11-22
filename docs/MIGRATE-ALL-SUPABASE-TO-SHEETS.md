# Migrasi seluruh data Supabase → Google Sheet (Class)

Mode Class memakai **Google Sheet + Apps Script** sebagai database primer.
Setiap tabel disimpan di tab Sheet dengan kolom: `id | json | updated_at`.

## Tabel Sheet yang didukung backend

| Tab Sheet | Sumber Supabase (perkiraan) |
|-----------|-----------------------------|
| `chat_rooms` | `gallery_chat_rooms` |
| `chat_messages` | `gallery_chat` |
| `announcements` | `gallery_announcements` |
| `attendance_sessions` | sesi absensi |
| `attendance_records` | rekap absensi |
| `alumni` | `gallery_alumni` |
| `angkatan` | `gallery_angkatan` |
| `websites` | `gallery_websites` |
| `videos` | `gallery_videos` |
| `profiles` | `gallery_profiles` |
| `_meta` | pengaturan / mode |

## Tahapan umum (setiap tabel)

1. **Export** dari Supabase SQL Editor → Download **JSON** (array of objects)  
2. Pastikan setiap baris punya field **`id`** (uuid/text unik)  
3. **Import** ke Sheet lewat:
   - `tools/chat-migrate.html` (ganti pilihan tabel bila sudah digeneralisasi), atau  
   - `tools/data-migrate.html` (jika tersedia), atau  
   - GAS `importBulk` dengan `table` sesuai nama tab  
4. Uji di halaman Class terkait  

## Urutan migrasi yang disarankan

1. `angkatan`  
2. `alumni` (users/siswa)  
3. `websites` + `videos`  
4. `announcements`  
5. `attendance_sessions` → lalu `attendance_records`  
6. `chat_rooms` → lalu `chat_messages`  
7. `profiles` (opsional)  
8. `_meta` (opsional)

## SQL export (jalankan satu per satu)

### angkatan
```sql
select id, label, year, sort_order, created_at
from gallery_angkatan
order by coalesce(sort_order,0), year desc;
```

### alumni / users
```sql
select id, name, class_code, role, angkatan_id, created_at
from gallery_alumni
order by name;
```

### websites
```sql
select *
from gallery_websites
order by created_at nulls last
limit 5000;
```

### videos
```sql
select *
from gallery_videos
order by created_at nulls last
limit 5000;
```

### announcements
```sql
select *
from gallery_announcements
order by created_at desc
limit 2000;
```

### chat_rooms
```sql
select id, name, description, access_password, is_active, sort_order, created_at,
       allowed_angkatan_ids, allowed_class_codes, allowed_students, source_angkatan_id
from gallery_chat_rooms
order by coalesce(sort_order,0), created_at;
```

### chat_messages
```sql
select id, room_id, user_id,
       author_name as display_name,
       avatar_emoji as avatar,
       body, reply_to, created_at, updated_at,
       angkatan_id, is_registered
from gallery_chat
order by created_at asc
limit 20000;
```

### attendance — cek nama tabel di Table Editor
```sql
-- sesuaikan nama tabel bila berbeda
select * from gallery_attendance_sessions order by created_at desc limit 2000;
select * from gallery_attendance_records order by created_at desc limit 10000;
```

### profiles
```sql
select * from gallery_profiles limit 5000;
```

> Jika nama tabel/kolom beda, jalankan:
> ```sql
> select table_name from information_schema.tables
> where table_schema='public' and table_name like 'gallery_%'
> order by 1;
> ```

## Import via GAS (setelah ClassSheetsBackend.gs versi importBulk)

Deploy Web App terbaru, lalu dari browser console di domain Class (atau tool migrasi):

```js
// contoh setelah login admin password tersimpan di tool
await fetch(SH_DB_BACKEND_CONFIG.gasUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    action: 'importBulk',
    table: 'alumni',
    password: 'PASSWORD_ADMIN_ANDA',
    rows: [ /* array dari export */ ]
  })
}).then(r => r.json()).then(console.log)
```

Atau gunakan `tools/chat-migrate.html` dengan memilih tabel yang sesuai (untuk chat), dan tool generik `tools/data-migrate.html` untuk tabel lain.

## Setelah migrasi

1. `data/db-backend-config.js` → `primary: "sheets"`, `allowSupabase: false`  
2. Uji: chat (kirim/hapus), absensi, pengumuman, gallery  
3. Hapus pesan chat harus hilang dari tab Sheet `chat_messages`  

## Catatan

- File media (gambar/suara) tetap URL lama (Supabase Storage) selama bucket publik  
- Sheet punya batas ukuran; jangan impor puluhan MB JSON sekaligus — pecah batch 500–1000 baris  
- Chat tidak realtime di mode Sheet (polling)
