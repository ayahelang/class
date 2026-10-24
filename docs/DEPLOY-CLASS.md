# Deploy class.silverhawk.web.id

## 1. Repo GitHub
- Buat repo **`ayahelang/class`** (public)
- Upload seluruh isi ZIP ini ke branch `main`

## 2. GitHub Pages
- Settings → Pages → Source: Deploy from **main** / root
- Custom domain: **class.silverhawk.web.id**
- Centang Enforce HTTPS setelah DNS propogasi

## 3. DNS (domain silverhawk.web.id)
```
CNAME  class  →  ayahelang.github.io
```
(atau sesuai username GitHub Pages Anda)

## 4. Supabase (proyek yang SAMA dengan webgal)
1. SQL Editor → jalankan `sql/patch-classroom-phase1-2.sql`
2. Authentication → URL configuration → tambahkan:
   - `https://class.silverhawk.web.id`
   - `https://class.silverhawk.web.id/`
   - (opsional local) `http://localhost:5500`
3. Jangan ubah RLS/tabel `gallery_*` kecuali Anda yakin

## 5. Isolasi dari webgal
- Deploy **tidak** menimpa repo `webgal`
- Tabel baru hanya `classroom_*`
- `webgal.silverhawk.web.id` tetap jalan seperti checkpoint 24 Okt 2026
