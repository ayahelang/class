# Checkpoint — Titik puncak sebelum upgrade Classroom

| Item | Nilai |
|------|--------|
| **Tanggal / jam** | **Sabtu, 24 Oktober 2026 · ± 20:09 WIB** (12:45 UTC commit terakhir terverifikasi) |
| **Repo** | [ayahelang/webgal](https://github.com/ayahelang/webgal) |
| **Branch** | `main` |
| **Commit SHA (restore point)** | `99d21da3ebc1d57914f0362dc0c49156bf336065` |
| **Commit URL** | https://github.com/ayahelang/webgal/commit/99d21da3ebc1d57914f0362dc0c49156bf336065 |
| **Parent** | `46dd7e0bad2d3e8719f302d549d3e8a8c8f2d470` |
| **Live** | https://webgal.silverhawk.web.id |
| **Stack** | GitHub Pages + Supabase (free) |
| **Pesan commit** | `Add files via upload` (histori edit via klik waktu chat, dll.) |

## Cara restore jika upgrade classroom merusak

### Opsi A — Reset branch `main` ke commit ini (hati-hati: hilangkan commit setelahnya di remote)

```bash
git clone https://github.com/ayahelang/webgal.git
cd webgal
git fetch origin
git checkout main
git reset --hard 99d21da3ebc1d57914f0362dc0c49156bf336065
# Hanya jika yakin:
# git push --force origin main
```

### Opsi B — Tag permanen (disarankan, non-destruktif)

Di GitHub: **Releases → Draft a new release** atau di terminal:

```bash
git tag -a pre-classroom-2026-10-24 -m "Puncak webgal sebelum Fase Classroom 1+2" 99d21da3ebc1d57914f0362dc0c49156bf336065
git push origin pre-classroom-2026-10-24
```

Lalu restore kapan saja:

```bash
git checkout pre-classroom-2026-10-24
# atau buat branch dari tag:
git checkout -b restore-pre-classroom pre-classroom-2026-10-24
```

### Opsi C — Download ZIP commit

https://github.com/ayahelang/webgal/archive/99d21da3ebc1d57914f0362dc0c49156bf336065.zip

## Cakupan fitur di titik ini (ringkas)

- Gallery website/video/desain, skills, refleksi, kisi-kisi, stats
- Auth Google, taut identitas, my-works, admin (roster, absensi, pengumuman, …)
- Chat realtime (reaksi, suara, mixer, histori edit via waktu)
- Absensi + lonceng jam pelajaran
- **Belum ada:** course/modul/materi, tugas+nilai formal (dimulai setelah checkpoint ini)

## CBT terpisah (Fase 3 — tidak digabung di upgrade ini)

- Live: https://cbt.silverhawk.web.id  
- Repo (akun sama): `ayahelang/cbt`  
- Rencana nanti: soal bergambar + penilaian essay oleh AI  

## Catatan untuk pengembang / Grok

Checkpoint ini adalah **baseline stabil**. Semua pekerjaan Classroom Fase 1+2 harus:

1. Menambah file/SQL baru sedapat mungkin (jangan merusak chat/absensi/gallery)
2. Bisa di-rollback ke SHA di atas
3. Tetap muat di Supabase free + GitHub Pages

