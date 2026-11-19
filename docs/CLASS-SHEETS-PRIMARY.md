# Class: Google Sheet sebagai database primer

## Tujuan
Versi **class** tetap jalan saat Supabase/Firebase kena kuota.

| Backend | Peran di Class |
|---------|----------------|
| **Google Apps Script + Sheet** | **Primer** (default) |
| Supabase | Opsional — diaktifkan admin di panel |
| Firebase | Opsional — diaktifkan admin di panel |

**Webgal** tetap memakai Supabase seperti commit terakhir (tidak diubah oleh paket ini).

## Batasan Sheet
- Chat **tidak realtime** (polling ~8 detik)
- Upload file suara/gambar besar: terbatas (simpan URL eksternal jika perlu)
- Throughput lebih rendah dari Supabase

## Setup (wajib)
1. Buat [Google Spreadsheet](https://sheets.google.com) kosong
2. [Apps Script](https://script.google.com) → tempel `scripts/ClassSheetsBackend.gs`
3. Script Properties:
   - `SPREADSHEET_ID` = id spreadsheet
   - `ADMIN_PASSWORD` = password admin class
4. Deploy → Web app → **Anyone** + Execute as **Me**
5. Isi di `data/db-backend-config.js`:
   ```js
   gasUrl: "https://script.google.com/macros/s/XXXX/exec",
   primary: "sheets",
   allowSupabase: false,
   allowFirebase: false,
   ```
6. Deploy class ke hosting

## Login
- Default: **password admin** (GAS), bukan Google
- Login Google hanya jika admin mengaktifkan **allowSupabase** (dan mode supabase)

## Panel admin — Mode database
Tab **Mode Kuota** / bagian Backend:
- Primary: Sheets | Supabase | Firebase
- Centang izinkan Supabase / Firebase

## Isolasi dari Webgal
- Class menulis ke **Spreadsheet sendiri** (SPREADSHEET_ID di GAS class)
- Webgal tetap ke project Supabase yang sama seperti sekarang
- Tidak saling menimpa data
- Bisa saling melengkapi: webgal live Supabase; class cadangan Sheet saat kuota habis
