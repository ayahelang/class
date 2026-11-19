# Migrasi chat Supabase → Google Sheet (Class)

Anda masih bisa masuk Supabase SQL Editor. Ikuti langkah ini agar chat di mode Sheet berisi data lama.

## 1. Export dari Supabase (SQL)

Jalankan di **SQL Editor**, lalu **Download CSV** hasilnya (atau salin).

### Ruang chat
```sql
select id, name, description, access_password, is_active, sort_order, created_at
from gallery_chat_rooms
order by sort_order nulls last, created_at;
```

### Pesan chat (batas wajar, mis. 90 hari terakhir)
```sql
select id, room_id, user_id, display_name, avatar, body, reply_to, created_at, updated_at
from gallery_chat_messages
where created_at > now() - interval '90 days'
order by created_at asc
limit 5000;
```

> Nama tabel bisa sedikit berbeda di project Anda. Cek di Table Editor: `gallery_chat_*`.

## 2. Import ke Sheet lewat Apps Script

1. Buka project GAS Class (`ClassSheetsBackend.gs`)
2. Tambahkan fungsi di file (atau tempel `scripts/ChatMigrateImport.gs`)
3. Script Properties sudah punya `SPREADSHEET_ID` dan `ADMIN_PASSWORD`
4. Cara A — **Manual JSON**: di GAS, jalankan `importChatJsonOnce()` setelah menempel JSON di script
5. Cara B — **Dari admin Class**: setelah login password, buka tab Sync / gunakan tool migrasi di `tools/chat-migrate.html` (jika di-deploy)

## 3. Operasikan chat di Class

1. Pastikan `gasUrl` di `data/db-backend-config.js` benar
2. Mode primer = sheets
3. Buka `chat.html` → pilih ruang → kirim pesan uji
4. Data baru tersimpan di tab Sheet `chat_messages` / `chat_rooms`

## 4. Catatan
- Chat Sheet **tidak realtime** (refresh/polling)
- Pesan suara/file: URL Supabase storage mungkin tetap bisa diputar selama bucket publik; file tidak otomatis pindah ke Drive
- Webgal tetap memakai Supabase; migrasi ini hanya mengisi cadangan Class
