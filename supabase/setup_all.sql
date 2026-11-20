-- Gist Bird · initial schema
-- Principles
--  * The school email lives only in auth.users. It is never copied into public tables.
--  * Clients never write to tables directly. All writes go through the security-definer functions below.
--  * Rules (daily limit, contact-info block, blocks, flight time) are enforced here, not only in the UI.

create extension if not exists pgcrypto;

-- ───────────────────────── config ─────────────────────────
create table public.app_config (
  key   text primary key,
  value text not null
);
insert into public.app_config (key, value) values
  ('daily_papers', '9'),                       -- placeholder, tune in the pilot
  ('min_paper_chars', '20'),
  ('max_paper_chars', '280'),
  ('flight_seconds_per_100_units', '30'),      -- map units are not metres; lower this for demos
  ('flight_min_seconds', '20'),
  ('flight_max_seconds', '600'),
  ('hold_hours', '24'),                        -- how long a recipient can hold a paper before it moves on
  ('max_hops', '3'),                           -- recipients tried before the paper comes back
  ('contact_unlock_messages', '10'),           -- contact info is allowed in chat after this many messages
  ('show_destination', 'true');                -- show the recipient's favourite spot as the flight target

create or replace function public.cfg_int(k text) returns int
language sql stable security definer set search_path = public as $$
  select value::int from app_config where key = k
$$;

create or replace function public.cfg_text(k text) returns text
language sql stable security definer set search_path = public as $$
  select value from app_config where key = k
$$;

create table public.allowed_domains (domain text primary key check (domain = lower(domain)));
-- Add your school domain(s), for example: insert into allowed_domains values ('run.edu.ng');

-- ───────────────────────── campus graph ─────────────────────────
create table public.campus_spots (
  id   text primary key,
  name text not null,
  kind text not null check (kind in ('shared','academic','faculty','gate','junction')),
  x    numeric not null,
  y    numeric not null
);
create table public.campus_edges (
  a    text not null references public.campus_spots(id),
  b    text not null references public.campus_spots(id),
  dist numeric not null check (dist > 0),
  primary key (a, b)
);

-- Distance in map units between two spots. The campus is a tree, so a bounded walk finds the path.
create or replace function public.spot_distance(p_a text, p_b text) returns numeric
language sql stable set search_path = public as $$
  with recursive e as (
    select a, b, dist from campus_edges
    union all
    select b, a, dist from campus_edges
  ), walk(node, total, path) as (
    select p_a, 0::numeric, array[p_a]
    union all
    select e.b, w.total + e.dist, w.path || e.b
    from walk w join e on e.a = w.node
    where not (e.b = any (w.path))
  )
  select min(total) from walk where node = p_b
$$;

create or replace function public.flight_seconds(p_dist numeric) returns int
language sql stable security definer set search_path = public as $$
  select greatest(
    cfg_int('flight_min_seconds'),
    least(cfg_int('flight_max_seconds'),
          round(coalesce(p_dist, 0) / 100.0 * cfg_int('flight_seconds_per_100_units'))::int)
  )
$$;

-- ───────────────────────── content filter ─────────────────────────
-- Mirrors src/lib/contentFilter.ts. Keep both in sync (tests cover the TS side).
create or replace function public.contains_contact_info(t text) returns boolean
language sql immutable as $$
  select coalesce(
       t ~* '(https?://|www\.)'
    or t ~* '\m[a-z0-9-]{2,}\.(com|ng|org|net|me|ly|io|co|app|link|gl)\M'
    or t ~* '(^|\s)@[a-z0-9_.]{3,}'
    or t ~  '(\d[\s.\-()]*){10,}'
    or t ~* '\m(whatsapp|telegram|instagram|snapchat|tiktok|facebook)\M',
    false)
$$;

-- ───────────────────────── people ─────────────────────────
create or replace function public.lagos_today() returns date
language sql stable as $$ select (now() at time zone 'Africa/Lagos')::date $$;

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text not null check (char_length(display_name) between 2 and 24),
  name_mode       text not null default 'alias' check (name_mode in ('real','alias')),
  scarf           text not null default 'green' check (scarf in ('green','lemon','coral','slate','ink')),
  interests       text[] not null default '{}' check (cardinality(interests) <= 5),
  favourite_spot  text references public.campus_spots (id),
  starter_prompt  text check (char_length(starter_prompt) <= 120),
  papers_day      date not null default public.lagos_today(),
  papers_used     int  not null default 0,
  status          text not null default 'active' check (status in ('active','paused')),
  paused_until    timestamptz,
  strikes         int  not null default 0,
  created_at      timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Only school emails can create an account.
create or replace function public.enforce_school_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from allowed_domains d where d.domain = lower(split_part(new.email, '@', 2))) then
    raise exception 'school_email_required';
  end if;
  return new;
end $$;
create trigger enforce_school_email before insert on auth.users
  for each row execute function public.enforce_school_email();

-- ───────────────────────── papers, chats, messages ─────────────────────────
create table public.papers (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles (id) on delete cascade,
  body         text not null check (char_length(body) between 20 and 280),
  origin_spot  text not null references public.campus_spots (id),
  recipient_id uuid references public.profiles (id) on delete set null,
  state        text not null default 'flying'
               check (state in ('flying','landed','opened','accepted','returned')),
  hops         int  not null default 0,
  passed_by    uuid[] not null default '{}',
  sent_at      timestamptz not null default now(),
  lands_at     timestamptz,
  expires_at   timestamptz
);
create index papers_recipient_idx on public.papers (recipient_id, state);
create index papers_author_idx on public.papers (author_id, sent_at desc);
create index papers_settle_idx on public.papers (state, lands_at, expires_at);

create table public.chats (
  id         uuid primary key default gen_random_uuid(),
  paper_id   uuid not null unique references public.papers (id) on delete cascade,
  user_a     uuid not null references public.profiles (id) on delete cascade,
  user_b     uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.messages (
  id         bigint generated always as identity primary key,
  chat_id    uuid not null references public.chats (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index messages_chat_idx on public.messages (chat_id, id);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  paper_id    uuid references public.papers (id) on delete set null,
  chat_id     uuid references public.chats (id) on delete set null,
  reason      text not null check (reason in ('money','contact','rude','uncomfortable','other')),
  details     text check (char_length(details) <= 500),
  status      text not null default 'open' check (status in ('open','reviewing','actioned','dismissed')),
  created_at  timestamptz not null default now()
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text,
  data       jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ───────────────────────── row level security ─────────────────────────
alter table public.app_config      enable row level security;
alter table public.allowed_domains enable row level security;
alter table public.campus_spots    enable row level security;
alter table public.campus_edges    enable row level security;
alter table public.profiles        enable row level security;
alter table public.blocks          enable row level security;
alter table public.papers          enable row level security;
alter table public.chats           enable row level security;
alter table public.messages        enable row level security;
alter table public.reports         enable row level security;
alter table public.notifications   enable row level security;

create policy spots_read on public.campus_spots for select to authenticated using (true);
create policy edges_read on public.campus_edges for select to authenticated using (true);
create policy profile_own on public.profiles for select to authenticated using (id = auth.uid());
create policy blocks_own on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy papers_author on public.papers for select to authenticated using (author_id = auth.uid());
create policy chats_member on public.chats for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy messages_member on public.messages for select to authenticated
  using (exists (select 1 from chats c where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)));
create policy notifications_own on public.notifications for select to authenticated using (user_id = auth.uid());
-- No insert/update/delete policies anywhere: writes happen only through the functions below.

-- ───────────────────────── helpers ─────────────────────────
create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;

create or replace function public.pick_recipient(p_author uuid, p_passed uuid[]) returns uuid
language sql volatile security definer set search_path = public as $$
  select p.id
  from profiles p
  where p.id <> p_author
    and p.status = 'active'
    and not (p.id = any (p_passed))
    and not is_blocked_between(p_author, p.id)
  order by
    (select count(*) from unnest(p.interests) i
      where i = any (coalesce((select interests from profiles where id = p_author), '{}'))) desc,
    random()
  limit 1
$$;

create or replace function public.require_active() returns profiles
language plpgsql security definer set search_path = public as $$
declare me profiles;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then raise exception 'profile_required'; end if;
  if me.status = 'paused' then
    if me.paused_until is not null and me.paused_until <= now() then
      update profiles set status = 'active', paused_until = null where id = me.id returning * into me;
    else
      raise exception 'account_paused';
    end if;
  end if;
  return me;
end $$;

-- ───────────────────────── profile ─────────────────────────
create or replace function public.save_profile(
  p_display_name text, p_name_mode text, p_scarf text,
  p_interests text[], p_spot text, p_starter text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_spot is not null and not exists (
    select 1 from campus_spots where id = p_spot and kind in ('shared','academic','gate')
  ) then raise exception 'invalid_spot'; end if;
  insert into profiles (id, display_name, name_mode, scarf, interests, favourite_spot, starter_prompt)
  values (auth.uid(), trim(p_display_name), p_name_mode, coalesce(p_scarf, 'green'),
          coalesce(p_interests, '{}'), p_spot, nullif(trim(p_starter), ''))
  on conflict (id) do update set
    display_name = excluded.display_name, name_mode = excluded.name_mode, scarf = excluded.scarf,
    interests = excluded.interests, favourite_spot = excluded.favourite_spot,
    starter_prompt = excluded.starter_prompt;
end $$;

create or replace function public.papers_left() returns int
language plpgsql security definer set search_path = public as $$
declare me profiles;
begin
  select * into me from profiles where id = auth.uid();
  if me.id is null then return 0; end if;
  if me.papers_day <> lagos_today() then return cfg_int('daily_papers'); end if;
  return greatest(0, cfg_int('daily_papers') - me.papers_used);
end $$;

-- ───────────────────────── paper lifecycle ─────────────────────────
create or replace function public.send_paper(p_body text, p_origin text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me profiles; body text := trim(p_body); rid uuid; rspot text; secs int; pid uuid;
begin
  me := require_active();
  if char_length(body) < cfg_int('min_paper_chars') then raise exception 'too_short'; end if;
  if char_length(body) > cfg_int('max_paper_chars') then raise exception 'too_long'; end if;
  if contains_contact_info(body) then raise exception 'contact_info'; end if;
  if not exists (select 1 from campus_spots where id = p_origin and kind in ('shared','academic','gate')) then
    raise exception 'invalid_spot';
  end if;
  if me.papers_day <> lagos_today() then
    update profiles set papers_day = lagos_today(), papers_used = 0 where id = me.id returning * into me;
  end if;
  if me.papers_used >= cfg_int('daily_papers') then raise exception 'no_papers_left'; end if;
  update profiles set papers_used = papers_used + 1 where id = me.id;

  rid := pick_recipient(me.id, '{}');
  if rid is null then
    insert into papers (author_id, body, origin_spot, state) values (me.id, body, p_origin, 'returned')
      returning id into pid;
    insert into notifications (user_id, kind, title, body, data)
      values (me.id, 'paper_returned', 'Nobody picked it up yet',
              'Campus is quiet right now. Try again a little later.', jsonb_build_object('paper_id', pid));
    return pid;
  end if;
  select coalesce(favourite_spot, 'gate') into rspot from profiles where id = rid;
  secs := flight_seconds(spot_distance(p_origin, rspot));
  insert into papers (author_id, body, origin_spot, recipient_id, lands_at, expires_at)
    values (me.id, body, p_origin, rid, now() + make_interval(secs => secs),
            now() + make_interval(secs => secs) + make_interval(hours => cfg_int('hold_hours')))
    returning id into pid;
  return pid;
end $$;

create or replace function public.advance_paper(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare p papers; prev_spot text; next_id uuid; next_spot text; secs int;
begin
  select * into p from papers where id = p_id for update;
  if p.id is null or p.state not in ('flying','landed','opened') then return; end if;
  prev_spot := coalesce((select favourite_spot from profiles where id = p.recipient_id), p.origin_spot);
  if p.recipient_id is not null then p.passed_by := p.passed_by || p.recipient_id; end if;
  p.hops := p.hops + 1;
  next_id := case when p.hops >= cfg_int('max_hops') then null else pick_recipient(p.author_id, p.passed_by) end;
  if next_id is null then
    update papers set state = 'returned', passed_by = p.passed_by, hops = p.hops,
           recipient_id = null, expires_at = null where id = p.id;
    insert into notifications (user_id, kind, title, body, data)
      values (p.author_id, 'paper_returned', 'Nobody picked it up yet',
              'Chief Coo dey come back. Send it again, or tweak the words first.',
              jsonb_build_object('paper_id', p.id));
  else
    next_spot := coalesce((select favourite_spot from profiles where id = next_id), 'gate');
    secs := flight_seconds(spot_distance(prev_spot, next_spot));
    update papers set recipient_id = next_id, state = 'flying', passed_by = p.passed_by, hops = p.hops,
           sent_at = now(), lands_at = now() + make_interval(secs => secs),
           expires_at = now() + make_interval(secs => secs) + make_interval(hours => cfg_int('hold_hours'))
     where id = p.id;
  end if;
end $$;

-- Lazy settle: runs on reads, and can also be scheduled (pg_cron, every minute).
create or replace function public.settle_papers() returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    with u as (
      update papers set state = 'landed'
      where state = 'flying' and lands_at <= now()
      returning id, author_id, recipient_id, hops
    ) select * from u
  loop
    insert into notifications (user_id, kind, title, body, data)
      values (r.recipient_id, 'paper_landed', 'A paper landed for you',
              'Come see what Chief Coo brought.', jsonb_build_object('paper_id', r.id));
    if r.hops = 0 then
      insert into notifications (user_id, kind, title, body, data)
        values (r.author_id, 'paper_delivered', 'Your paper don land',
                'Chief Coo delivered it safely.', jsonb_build_object('paper_id', r.id));
    end if;
  end loop;
  for r in select id from papers where state in ('landed','opened') and expires_at < now() loop
    perform advance_paper(r.id);
  end loop;
end $$;

create or replace function public.open_paper(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_active();
  update papers set state = 'opened'
   where id = p_id and recipient_id = auth.uid() and state = 'landed';
end $$;

create or replace function public.pass_paper(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform require_active();
  if not exists (select 1 from papers where id = p_id and recipient_id = auth.uid()
                 and state in ('landed','opened')) then raise exception 'not_found'; end if;
  perform advance_paper(p_id);
end $$;

create or replace function public.accept_paper(p_id uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare p papers; cid uuid; me profiles;
begin
  me := require_active();
  select * into p from papers where id = p_id and recipient_id = me.id and state in ('landed','opened') for update;
  if p.id is null then raise exception 'not_found'; end if;
  if is_blocked_between(p.author_id, me.id) then raise exception 'not_found'; end if;
  update papers set state = 'accepted' where id = p.id;
  insert into chats (paper_id, user_a, user_b) values (p.id, p.author_id, me.id) returning id into cid;
  insert into notifications (user_id, kind, title, body, data)
    values (p.author_id, 'paper_accepted', me.display_name || ' said hi!', 'Your paper got a reply.',
            jsonb_build_object('chat_id', cid, 'paper_id', p.id));
  return cid;
end $$;

-- ───────────────────────── reads for the app ─────────────────────────
create or replace function public.get_inbox() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform settle_papers();
  return coalesce((
    select jsonb_agg(x order by x->>'landed_at' desc) from (
      select jsonb_build_object(
        'id', p.id, 'state', p.state, 'landed_at', p.lands_at,
        'body', case when p.state = 'opened' then p.body end,
        'from_name', a.display_name, 'from_scarf', a.scarf,
        'interests', a.interests, 'spot', s.name) as x
      from papers p
      join profiles a on a.id = p.author_id
      left join campus_spots s on s.id = a.favourite_spot
      where p.recipient_id = auth.uid() and p.state in ('landed','opened')
        and not is_blocked_between(auth.uid(), p.author_id)
    ) t), '[]'::jsonb);
end $$;

create or replace function public.get_sent() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform settle_papers();
  return coalesce((
    select jsonb_agg(x order by x->>'sent_at' desc) from (
      select jsonb_build_object(
        'id', p.id, 'body', p.body, 'state', p.state, 'sent_at', p.sent_at, 'lands_at', p.lands_at,
        'origin', p.origin_spot,
        'dest', case when cfg_text('show_destination') = 'true' and p.state = 'flying'
                     then (select favourite_spot from profiles where id = p.recipient_id) end,
        'chat_id', (select c.id from chats c where c.paper_id = p.id)) as x
      from papers p where p.author_id = auth.uid()
      order by p.sent_at desc limit 50
    ) t), '[]'::jsonb);
end $$;

create or replace function public.get_paper(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p papers; a profiles; role text;
begin
  perform settle_papers();
  select * into p from papers where id = p_id;
  if p.id is null then return null; end if;
  if p.recipient_id = auth.uid() and p.state in ('landed','opened') then
    role := 'recipient';
  elsif p.author_id = auth.uid() then
    role := 'author';
  else
    return null;
  end if;
  select * into a from profiles where id = p.author_id;
  return jsonb_build_object(
    'role', role, 'id', p.id, 'state', p.state,
    'body', case when role = 'author' or p.state = 'opened' then p.body end,
    'from_name', case when role = 'recipient' then a.display_name end,
    'from_scarf', case when role = 'recipient' then a.scarf end,
    'interests', case when role = 'recipient' then to_jsonb(a.interests) end,
    'spot', case when role = 'recipient' then (select name from campus_spots where id = a.favourite_spot) end,
    'origin', p.origin_spot, 'sent_at', p.sent_at, 'lands_at', p.lands_at,
    'dest', case when role = 'author' and p.state = 'flying' and cfg_text('show_destination') = 'true'
                 then (select favourite_spot from profiles where id = p.recipient_id) end,
    'chat_id', (select c.id from chats c where c.paper_id = p.id and role = 'author'));
end $$;

create or replace function public.get_chats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  return coalesce((
    select jsonb_agg(x order by x->>'last_at' desc) from (
      select jsonb_build_object(
        'id', c.id, 'other_id', o.id, 'other_name', o.display_name, 'other_scarf', o.scarf,
        'last', (select body from messages m where m.chat_id = c.id order by m.id desc limit 1),
        'last_at', coalesce((select created_at from messages m where m.chat_id = c.id order by m.id desc limit 1), c.created_at)
      ) as x
      from chats c
      join profiles o on o.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
      where auth.uid() in (c.user_a, c.user_b)
        and not is_blocked_between(auth.uid(), o.id)
    ) t), '[]'::jsonb);
end $$;

create or replace function public.get_chat(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c chats; o profiles; p papers;
begin
  select * into c from chats where id = p_id and auth.uid() in (user_a, user_b);
  if c.id is null then return null; end if;
  select * into o from profiles where id = case when c.user_a = auth.uid() then c.user_b else c.user_a end;
  select * into p from papers where id = c.paper_id;
  return jsonb_build_object(
    'id', c.id, 'other_id', o.id, 'other_name', o.display_name, 'other_scarf', o.scarf,
    'other_interests', to_jsonb(o.interests), 'other_starter', o.starter_prompt,
    'paper_body', p.body, 'blocked', is_blocked_between(auth.uid(), o.id),
    'me', auth.uid());
end $$;

create or replace function public.send_message(p_chat uuid, p_body text) returns bigint
language plpgsql security definer set search_path = public as $$
declare c chats; me profiles; body text := trim(p_body); mid bigint; other uuid; total int;
begin
  me := require_active();
  select * into c from chats where id = p_chat and me.id in (user_a, user_b);
  if c.id is null then raise exception 'not_found'; end if;
  other := case when c.user_a = me.id then c.user_b else c.user_a end;
  if is_blocked_between(me.id, other) then raise exception 'not_found'; end if;
  if char_length(body) = 0 then raise exception 'too_short'; end if;
  select count(*) into total from messages where chat_id = c.id;
  if contains_contact_info(body) and total < cfg_int('contact_unlock_messages') then
    raise exception 'contact_info';
  end if;
  insert into messages (chat_id, sender_id, body) values (c.id, me.id, body) returning id into mid;
  if not exists (select 1 from notifications where user_id = other and kind = 'new_message'
                 and read_at is null and (data->>'chat_id') = c.id::text
                 and created_at > now() - interval '5 minutes') then
    insert into notifications (user_id, kind, title, body, data)
      values (other, 'new_message', me.display_name || ' sent you a message', null,
              jsonb_build_object('chat_id', c.id));
  end if;
  return mid;
end $$;

create or replace function public.get_notifications() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc), '[]'::jsonb)
  from (select id, kind, title, body, data, read_at, created_at
        from notifications where user_id = auth.uid() order by created_at desc limit 50) n
$$;

create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = public as $$
  update notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

-- ───────────────────────── safety ─────────────────────────
create or replace function public.block_user(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_user = auth.uid() then raise exception 'not_found'; end if;
  insert into blocks (blocker_id, blocked_id) values (auth.uid(), p_user) on conflict do nothing;
end $$;

create or replace function public.unblock_user(p_user uuid) returns void
language sql security definer set search_path = public as $$
  delete from blocks where blocker_id = auth.uid() and blocked_id = p_user
$$;

create or replace function public.get_blocks() returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.display_name, 'scarf', p.scarf)), '[]'::jsonb)
  from blocks b join profiles p on p.id = b.blocked_id where b.blocker_id = auth.uid()
$$;

-- The server works out who is being reported from the paper or chat, so the app never needs the other person's id.
create or replace function public.report_user(
  p_reason text, p_details text, p_paper uuid, p_chat uuid, p_block boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  if auth.uid() is null then raise exception 'not_found'; end if;
  if p_paper is not null then
    select author_id into target from papers where id = p_paper and recipient_id = auth.uid();
  end if;
  if target is null and p_chat is not null then
    select case when user_a = auth.uid() then user_b else user_a end into target
      from chats where id = p_chat and auth.uid() in (user_a, user_b);
  end if;
  if target is null or target = auth.uid() then raise exception 'not_found'; end if;
  insert into reports (reporter_id, reported_id, paper_id, chat_id, reason, details)
    values (auth.uid(), target, p_paper, p_chat, p_reason, nullif(trim(p_details), ''));
  if p_block then perform block_user(target); end if;
end $$;

-- ───────────────────────── permissions ─────────────────────────
revoke all on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.save_profile(text, text, text, text[], text, text),
  public.papers_left(),
  public.send_paper(text, text),
  public.open_paper(uuid), public.pass_paper(uuid), public.accept_paper(uuid),
  public.get_inbox(), public.get_sent(), public.get_paper(uuid),
  public.get_chats(), public.get_chat(uuid), public.send_message(uuid, text),
  public.get_notifications(), public.mark_notifications_read(),
  public.block_user(uuid), public.unblock_user(uuid), public.get_blocks(),
  public.report_user(text, text, uuid, uuid, boolean),
  public.settle_papers()
to authenticated;
grant execute on function public.contains_contact_info(text) to authenticated;

-- Realtime for live chat and notifications (RLS still applies)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.notifications;
  end if;
end $$;
-- Settle papers every minute (landing, 24h hold expiry, returns) using pg_cron where available.
-- On Supabase, enable the extension once: Dashboard → Database → Extensions → pg_cron.
-- If pg_cron is not enabled, nothing breaks: papers also settle lazily whenever someone loads
-- Inbox, Sent or a paper page.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'gist-bird-settle-papers';
    perform cron.schedule('gist-bird-settle-papers', '* * * * *', 'select public.settle_papers()');
  else
    raise notice 'pg_cron is not enabled; skipping the settle schedule (lazy settling still works).';
  end if;
end $$;
-- GENERATED by scripts/gen-campus-sql.mjs. Do not edit by hand.
insert into public.campus_spots (id, name, kind, x, y) values
  ('gate', 'School gate', 'gate', 60, 740),
  ('mimis', 'Mimis', 'shared', 130, 690),
  ('nk', 'NK', 'shared', 205, 650),
  ('chapel', 'Chapel', 'shared', 262, 590),
  ('lr', 'LR', 'academic', 215, 540),
  ('labs', 'Labs', 'academic', 170, 490),
  ('field', 'Field', 'shared', 125, 440),
  ('peace_park', 'Peace Park', 'shared', 340, 560),
  ('container', 'Container', 'shared', 410, 525),
  ('manna', 'Manna', 'shared', 455, 478),
  ('health_centre', 'Health Centre', 'shared', 472, 415),
  ('junction', 'T-junction', 'junction', 472, 250),
  ('dp', 'DP', 'shared', 472, 70),
  ('numbers_graveyard', 'Numbers graveyard', 'shared', 420, 250),
  ('food_mart', 'Food Mart', 'shared', 360, 250),
  ('bms', 'BMS', 'faculty', 300, 250),
  ('seap', 'SEAP', 'faculty', 240, 250),
  ('engineering', 'Engineering', 'faculty', 180, 250),
  ('sapetro', 'Sapetro', 'shared', 115, 250)
on conflict (id) do update set name = excluded.name, kind = excluded.kind, x = excluded.x, y = excluded.y;
delete from public.campus_edges;
insert into public.campus_edges (a, b, dist) values
  ('gate', 'mimis', 86.0),
  ('mimis', 'nk', 85.0),
  ('nk', 'chapel', 82.8),
  ('chapel', 'peace_park', 83.6),
  ('peace_park', 'container', 78.3),
  ('container', 'manna', 65.1),
  ('manna', 'health_centre', 65.3),
  ('health_centre', 'junction', 165.0),
  ('junction', 'dp', 180.0),
  ('chapel', 'lr', 68.6),
  ('lr', 'labs', 67.3),
  ('labs', 'field', 67.3),
  ('junction', 'numbers_graveyard', 52.0),
  ('numbers_graveyard', 'food_mart', 60.0),
  ('food_mart', 'bms', 60.0),
  ('bms', 'seap', 60.0),
  ('seap', 'engineering', 60.0),
  ('engineering', 'sapetro', 65.0);
