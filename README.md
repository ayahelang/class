# Silverhawk Class (`class`)

Kloningan penuh **webgal** + modul **Classroom Fase 1 & 2**, untuk deploy di:

**https://class.silverhawk.web.id**

Repo GitHub: `ayahelang/class`  
Database: **proyek Supabase yang sama** dengan [webgal](https://webgal.silverhawk.web.id)  
Isolasi: tabel baru `classroom_*` saja — **tidak mengubah** tabel `gallery_*`.

## Checkpoint webgal (restore)

Sebelum jalur classroom:  
https://github.com/ayahelang/webgal/commit/99d21da3ebc1d57914f0362dc0c49156bf336065 · 24 Okt 2026

## Fitur Classroom (baru)

| Halaman | Isi |
|---------|-----|
| `classroom.html` | Daftar course |
| `classroom-course.html` | Modul, materi, progress, kumpul tugas |
| `classroom-admin.html` | Panel pengajar: course/modul/materi/tugas/nilai |

SQL: `sql/patch-classroom-phase1-2.sql` (wajib di-run sekali di Supabase)

## Deploy

1. Buat repo **ayahelang/class**, upload isi folder ini ke `main`
2. Pages → `main` / root → custom domain **class.silverhawk.web.id**
3. DNS: `CNAME class → ayahelang.github.io`
4. Supabase Auth → Redirect URLs: tambah `https://class.silverhawk.web.id`
5. SQL Editor → jalankan `sql/patch-classroom-phase1-2.sql`

Detail: `docs/DEPLOY-CLASS.md`

## Yang tetap dari webgal

Gallery, video, desain, chat, absensi, admin, skills, dll. — semua ikut dalam paket ini supaya class punya ekosistem lengkap di domain sendiri, tanpa mengganggu deploy webgal.
