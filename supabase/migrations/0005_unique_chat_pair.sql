-- Merge duplicate chats between the same pair of users so each pair shares one unified chat.
create unique index if not exists chats_unique_pair_idx
  on public.chats (least(user_a, user_b), greatest(user_a, user_b));
