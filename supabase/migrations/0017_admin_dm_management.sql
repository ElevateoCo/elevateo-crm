create or replace function admin_list_dm_rooms() returns table (
  id uuid,
  user_a_id uuid,
  user_b_id uuid,
  created_at timestamptz,
  message_count bigint,
  last_message_at timestamptz
) as $$
begin
  if not is_admin() then raise exception 'Not authorized'; end if;
  return query
  select r.id, r.user_a_id, r.user_b_id, r.created_at,
    (select count(*) from chat_messages where room_id = r.id) as message_count,
    (select max(created_at) from chat_messages where room_id = r.id) as last_message_at
  from chat_rooms r
  where r.kind = 'dm'
  order by r.created_at desc;
end;
$$ language plpgsql security definer;

grant execute on function admin_list_dm_rooms() to authenticated;

create or replace function admin_delete_room(p_room_id uuid) returns void as $$
begin
  if not is_admin() then raise exception 'Not authorized'; end if;
  delete from chat_rooms where id = p_room_id;
end;
$$ language plpgsql security definer;

grant execute on function admin_delete_room(uuid) to authenticated;
