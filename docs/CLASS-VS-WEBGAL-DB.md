# Class vs Webgal — database

| | **class** | **webgal** |
|--|-----------|------------|
| Default DB | Google Sheet + Apps Script | Supabase |
| Firebase | Opsional (admin) | Opsional / failover |
| Login Google | Hanya jika Supabase diaktifkan admin | Normal Supabase Auth |
| Chat | Polling (Sheet) | Realtime Supabase |
| Isolasi | Spreadsheet ID sendiri di GAS | Project Supabase bersama (gallery_*) |

Keduanya saling melengkapi: webgal tetap penuh fitur saat kuota aman; class tetap hidup lewat Sheet saat Supabase terbatas.
