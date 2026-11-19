-- Export chat untuk migrasi ke Google Sheet (Class)
-- Jalankan di Supabase SQL Editor

-- 1) Ruang
select id, name, description, access_password, is_active, sort_order, created_at
from gallery_chat_rooms
order by coalesce(sort_order, 0), created_at;

-- 2) Pesan (90 hari, max 5000) — sesuaikan nama kolom jika beda di project Anda
select id, room_id, user_id, display_name, avatar, body, reply_to, created_at, updated_at
from gallery_chat_messages
where created_at > now() - interval '90 days'
order by created_at asc
limit 5000;
