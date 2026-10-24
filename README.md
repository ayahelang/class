# Silverhawk Class

Online classroom (Fase 1 + 2) untuk SMA PMA / Silverhawk.

- **Live (rencana):** https://class.silverhawk.web.id  
- **Repo:** `ayahelang/class`  
- **Database:** **sama** dengan [webgal](https://webgal.silverhawk.web.id) (satu proyek Supabase)  
- **Isolasi data:** hanya tabel berawalan `classroom_*` — **tidak** mengubah tabel `gallery_*` (chat, absensi, karya, dll.)

## Deploy GitHub Pages

1. Buat repo `class` di akun `ayahelang`
2. Upload isi folder ini ke `main`
3. Settings → Pages → Deploy from branch `main` /
4. Custom domain: `class.silverhawk.web.id` (CNAME sudah ada)
5. DNS: CNAME `class` → `ayahelang.github.io`

## Supabase (wajib sekali)

Jalankan di SQL Editor proyek **yang sama** dengan webgal:

`sql/patch-classroom-phase1-2.sql`

Ini hanya **CREATE TABLE IF NOT EXISTS** untuk `classroom_*`. Aman untuk webgal.

## Webgal tetap aman karena

| Webgal | Class |
|--------|--------|
| Domain & repo terpisah | Domain & repo terpisah |
| Tabel `gallery_*` | Tabel `classroom_*` baru |
| Kode/deploy tidak saling timpa | Kode/deploy tidak saling timpa |
| Satu Supabase project | Satu Supabase project |

## Fase

- **Fase 1:** Course → Modul → Materi → Progress  
- **Fase 2:** Tugas → Kumpul → Nilai  
- **Fase 3 (CBT):** https://cbt.silverhawk.web.id (repo terpisah)

## Checkpoint webgal (jangan dihapus)

Sebelum classroom: commit `99d21da3ebc1d57914f0362dc0c49156bf336065` di repo `webgal` · 24 Okt 2026.
