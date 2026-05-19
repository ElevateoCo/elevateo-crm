-- DMs are private. Admins/owners can DELETE a DM (moderation) but never SELECT or
-- post into a DM they aren't a participant of. Division channels still let admins
-- see/moderate everything.

drop policy if exists chat_rooms_read on chat_rooms;
drop policy if exists chat_rooms_insert on chat_rooms;
drop policy if exists chat_rooms_delete on chat_rooms;

create policy chat_rooms_read on chat_rooms for select using (
  (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
  or (kind = 'division' and (
        is_admin()
        or exists(
          select 1 from users u left join divisions d on d.id = chat_rooms.division_id
          where u.id = auth.uid() and (u.division_id = chat_rooms.division_id or d.code = any(u.divisions))
        )
      ))
);

create policy chat_rooms_insert on chat_rooms for insert with check (
  (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
  or is_admin()
);

create policy chat_rooms_delete on chat_rooms for delete using (
  is_admin()
  or (kind = 'dm' and (user_a_id = auth.uid() or user_b_id = auth.uid()))
);

create or replace function can_access_room(p_room_id uuid) returns boolean as $$
  select exists(
    select 1 from chat_rooms r
    left join users u on u.id = auth.uid()
    left join divisions d on d.id = r.division_id
    where r.id = p_room_id
      and (
        (r.kind = 'dm' and (r.user_a_id = auth.uid() or r.user_b_id = auth.uid()))
        or (r.kind = 'division' and (
              is_admin()
              or u.division_id = r.division_id
              or d.code = any(u.divisions)
            ))
      )
  );
$$ language sql stable security definer;
