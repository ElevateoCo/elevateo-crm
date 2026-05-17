alter table users
  add column if not exists divisions division_code[] not null default '{}',
  add column if not exists cold_call_goal integer not null default 40;

update users
set divisions = case
  when division_id is null then '{}'
  else array[
    (
      select code
      from divisions
      where divisions.id = users.division_id
    )::division_code
  ]
end
where cardinality(divisions) = 0;

create or replace function handle_new_user() returns trigger as $$
declare
  primary_division_code division_code;
begin
  primary_division_code :=
    case
      when new.raw_user_meta_data ? 'division_code'
      then (new.raw_user_meta_data->>'division_code')::division_code
      else null
    end;

  insert into public.users (id, email, full_name, divisions, cold_call_goal)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when primary_division_code is null then '{}'
      else array[primary_division_code]
    end,
    40
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$ language plpgsql security definer;
