-- Mini chat: per-division group rooms + 1:1 DMs.
-- Messages auto-purge after 7 days unless pinned.

create type chat_room_kind as enum ('division', 'dm');

create table chat_rooms (
  id uuid primary key default gen_random_uuid(),
  kind chat_room_kind not null,
  division_id uuid references divisions(id) on delete cascade,
  user_a_id uuid references users(id) on delete cascade,
  user_b_id uuid references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint chat_rooms_division_shape check (
    (kind <> 'division') or (division_id is not null and user_a_id is null and user_b_id is null)
  ),
  constraint chat_rooms_dm_shape check (
    (kind <> 'dm') or
    (division_id is null and user_a_id is not null and user_b_id is not null and user_a_id < user_b_id)
  )
);

create unique index chat_rooms_one_per_division on chat_rooms(division_id) where kind = 'division';
create unique index chat_rooms_one_per_pair on chat_rooms(user_a_id, user_b_id) where kind = 'dm';

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references chat_rooms(id) on delete cascade,
  author_id uuid references users(id) on delete set null,
  body text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index chat_messages_room_idx on chat_messages(room_id, created_at desc);
create index chat_messages_purge_idx on chat_messages(created_at) where pinned = false;

alter table chat_rooms enable row level security;
alter table chat_messages enable row level security;

create or replace function can_access_room(p_room_id uuid) returns boolean as $$
  select exists(
    select 1 from chat_rooms r
    left join users u on u.id = auth.uid()
    left join divisions d on d.id = r.division_id
    where r.id = p_room_id
      and (
        is_admin()
        or (r.kind = 'dm' and (r.user_a_id = auth.uid() or r.user_b_id = auth.uid()))
        or (r.kind = 'division' and (u.division_id = r.division_id or d.code = any(u.divisions)))
      )
  );
$$ language sql stable security definer;

-- ROOMS: read if you can access; admins write/delete.
create policy chat_rooms_read on chat_rooms for select using (
  is_admin()
  or (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
  or (kind = 'division' and exists(
        select 1 from users u left join divisions d on d.id = chat_rooms.division_id
        where u.id = auth.uid() and (u.division_id = chat_rooms.division_id or d.code = any(u.divisions))
      ))
);
create policy chat_rooms_insert on chat_rooms for insert
  with check (
    is_admin()
    or (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
  );
create policy chat_rooms_delete on chat_rooms for delete using (is_admin());

-- MESSAGES: same access as the room. Authors can edit own pinning (any participant can pin).
create policy chat_messages_read on chat_messages for select
  using (can_access_room(room_id));
create policy chat_messages_insert on chat_messages for insert
  with check (auth.uid() = author_id and can_access_room(room_id));
create policy chat_messages_update on chat_messages for update
  using (can_access_room(room_id))
  with check (can_access_room(room_id));
create policy chat_messages_delete on chat_messages for delete
  using (author_id = auth.uid() or is_admin());

-- Seed one chat room per existing division (idempotent).
insert into chat_rooms (kind, division_id)
select 'division', d.id from divisions d
on conflict do nothing;

-- DM creator: ensures only one room per pair, normalises ordering.
create or replace function get_or_create_dm(p_other uuid) returns uuid as $$
declare
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_room uuid;
begin
  if v_me is null then raise exception 'Not authenticated'; end if;
  if p_other = v_me then raise exception 'Cannot DM yourself.'; end if;

  if v_me < p_other then
    v_a := v_me; v_b := p_other;
  else
    v_a := p_other; v_b := v_me;
  end if;

  select id into v_room from chat_rooms
    where kind = 'dm' and user_a_id = v_a and user_b_id = v_b;
  if v_room is not null then return v_room; end if;

  insert into chat_rooms (kind, user_a_id, user_b_id)
    values ('dm', v_a, v_b)
    returning id into v_room;
  return v_room;
end;
$$ language plpgsql security definer;

grant execute on function get_or_create_dm(uuid) to authenticated;
grant execute on function can_access_room(uuid) to authenticated;

-- Schedule the 7-day purge of non-pinned chat messages.
do $$
begin
  perform cron.unschedule('purge-chat-messages');
exception when others then null;
end$$;

select cron.schedule(
  'purge-chat-messages',
  '0 4 * * *',
  $$ delete from chat_messages where pinned = false and created_at < now() - interval '7 days' $$
);
