# Setup izin Google Drive untuk pesan suara / audio mixer

Error `DriveApp.getFoldersByName` / `You do not have permission to call DriveApp` artinya **scope Drive belum diotorisasi** di project Apps Script.

## Langkah (sekali saja)

### A. Aktifkan manifest + scope Drive

1. Buka [script.google.com](https://script.google.com) → project Class (yang `gasUrl` di `data/db-backend-config.js`).
2. Kiri: **Project Settings** (ikon roda gigi).
3. Centang **Show "appsscript.json" manifest file in editor**.
4. Kembali ke **Editor** → file **`appsscript.json`** harus muncul.
5. Pastikan isinya memuat (minimal):

```json
"oauthScopes": [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/script.scriptapp",
  "https://www.googleapis.com/auth/script.external_request",
  "https://www.googleapis.com/auth/userinfo.email"
]
```

   Bisa salin penuh dari `scripts/appsscript.json` di repo.

6. **Ctrl+S** simpan.

### B. Jalankan otorisasi

1. Tempel `Code.gs` terbaru dari `scripts/ClassSheetsBackend.gs` (jika belum).
2. Dropdown fungsi → **`setupDriveMedia`** → **Run ▶️**.
3. Harus muncul **Authorization required** → **Review permissions** → pilih akun → **Advanced** (jika ada peringatan) → **Allow** / **Go to … (unsafe)** → izinkan **Google Drive** + Sheets.
4. Execution log harus: `OK Drive authorized. Folder id=...`

### C. Deploy ulang web app

1. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
2. Hard-refresh site class → coba kirim pesan suara.

## Jika dialog Allow tetap tidak muncul

1. Buka [https://myaccount.google.com/permissions](https://myaccount.google.com/permissions)
2. Cari project / “Google Apps Script” terkait → **Remove access**
3. Ulangi langkah B (Run `setupDriveMedia`)

## Akun Google Workspace (sekolah/kantor)

Admin domain bisa memblokir scope Drive untuk Apps Script. Minta admin mengizinkan, atau pakai akun Gmail pribadi untuk project GAS ini.
