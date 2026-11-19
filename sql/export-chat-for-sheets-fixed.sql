-- Class: export chat penuh untuk migrasi ke Google Sheet
-- 1) Ruang
select id, name, description, access_password, is_active, sort_order, created_at
from gallery_chat_rooms
order by coalesce(sort_order, 0), created_at;

-- 2) Semua pesan (naikkan limit bila perlu)
select
  id,
  room_id,
  user_id,
  author_name as display_name,
  avatar_emoji as avatar,
  body,
  reply_to,
  created_at,
  updated_at
from gallery_chat
order by created_at asc
limit 20000;
