# Perbaiki histori chat hilang

1. Deploy file `scripts/ClassSheetsBackend.gs` ke project Apps Script Class (ganti Code.gs / file yang sama).
2. Deploy → Manage deployments → Edit → **New version** → Deploy.
3. Upload `js/db-sheets.js` + `js/chat.js` ke GitHub Pages class.
4. Hard refresh chat.html, buka ruang "52 - Tugas Pengembangan" lagi.

Penyebab: sebelumnya hanya 500 pesan terbaru *semua ruang* yang diambil, lalu difilter room — pesan kemarin di satu ruang bisa terbuang.
