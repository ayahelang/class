# Classroom Fase 1 + Fase 2 — Rencana & status

**Mulai dari:** checkpoint `pre-classroom` (24 Okt 2026)  
**CBT (Fase 3):** terpisah di https://cbt.silverhawk.web.id (`ayahelang/cbt`) — soal bergambar + AI essay *nanti*.

## Fase 1 — Kerangka belajar
- [x] Skema SQL: `classroom_courses`, `modules`, `materials`, `enrollments`, `progress`
- [ ] Halaman `classroom.html` (daftar course)
- [ ] `classroom-course.html` (modul + materi + tandai selesai)
- [ ] Admin: CRUD course/modul/materi
- [ ] Progress % per siswa

## Fase 2 — Tugas & nilai
- [x] Skema SQL: `assignments`, `submissions`, `grades`
- [ ] UI siswa: lihat tugas, kumpul link/teks, status late
- [ ] UI pengajar: daftar pengumpulan, skor + feedback
- [ ] Gradebook sederhana per course

## Prinsip teknis
- Storage hemat: prefer **link Drive/YouTube**, bukan upload file besar
- Role: manfaatkan `gallery_profiles` + enrollment `teacher`/`student`
- Jangan sentuh tabel chat/absensi kecuali perlu join ringan
