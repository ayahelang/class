# Perbaiki error import: "number of rows in the data does not match"

## Penyebab
Google Sheet menolak `setValues` bila:
- ada **sel digabung (merged)**, atau
- rentang tulis tidak 1 baris × 3 kolom.

## Perbaikan (urut)
1. Buka Spreadsheet → tab **chat_rooms** (dan **chat_messages** jika ada).
2. Pilih seluruh sheet (klik kotak kiri atas) → **Format → Merge cells → Unmerge**.
3. Ganti **Code.gs** dengan `scripts/ClassSheetsBackend.gs` dari zip ini (seluruh isi).
4. Di editor GAS: Run fungsi **`fixUnmergeChatTabs`** sekali (izin spreadsheet).
5. **Deploy → Manage deployments → Edit → New version → Deploy**.
6. Import ulang:
   - **Ruang:** di editor GAS, pilih fungsi **`importRoomsOnce`** → Run  
     (lebih stabil daripada tool web untuk 10 room).
   - **Pesan:** buka `tools/chat-migrate.html` → tabel `chat_messages` → tempel JSON **bertahap 50–100 baris** → Import  
     (skrip baru memakai tulis **sel per sel**, bukan `setValues` array 2D yang bentrok merge).

## Cek sukses
- Tab `chat_rooms` punya ~10 baris data di bawah header.
- Tab `chat_messages` bertambah tiap batch import.
- `chat.html` di Class menampilkan daftar ruang.
