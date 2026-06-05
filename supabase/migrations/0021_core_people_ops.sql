-- Core People Ops support:
-- 1) Allow core members (owner/executive/lead) to create standard non-admin users.
-- 2) Seed a non-admin core test account for QA.

create or replace function core_create_user(
  p_email text,
  p_full_name text,
  p_role user_role default 'member',
  p_division_code division_code default null,
  p_manager_email text default null
) returns uuid as $$
declare
  v_user_id uuid := gen_random_uuid();
  v_division_id uuid;
  v_manager_id uuid;
  v_manager_role user_role;
begin
  if my_role() not in ('owner', 'executive', 'lead') then
    raise exception 'Not authorized';
  end if;

  if p_role not in ('lead', 'member', 'reservist', 'external') then
    raise exception 'Core People Ops can only create lead/member/reservist/external accounts.';
  end if;

  if p_division_code = 'admin' then
    raise exception 'Core People Ops cannot create admin-division users.';
  end if;

  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'A user with that email already exists.';
  end if;

  if p_division_code is not null then
    select id into v_division_id from divisions where code = p_division_code;
  end if;

  if p_manager_email is not null then
    select id, role into v_manager_id, v_manager_role
    from public.users
    where email = p_manager_email;

    if v_manager_id is null then
      raise exception 'Manager not found.';
    end if;

    if not is_admin() and v_manager_role in ('owner', 'executive') then
      raise exception 'Core People Ops cannot assign owners or executives as managers.';
    end if;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000'::uuid,
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt('password123', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'must_change_password', true),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider, created_at, updated_at, last_sign_in_at
  ) values (
    gen_random_uuid(),
    p_email,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', true),
    'email',
    now(), now(), null
  );

  update public.users
  set
    full_name = p_full_name,
    role = p_role,
    division_id = v_division_id,
    manager_id = v_manager_id,
    divisions = case when p_division_code is not null then array[p_division_code]::division_code[] else '{}'::division_code[] end,
    updated_at = now()
  where id = v_user_id;

  return v_user_id;
end;
$$ language plpgsql security definer;

grant execute on function core_create_user(text, text, user_role, division_code, text) to authenticated;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'core@elevateoco.com',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', 'Core Member', 'must_change_password', true),
  now(),
  now(),
  '',
  '',
  '',
  ''
where not exists (
  select 1 from auth.users where email = 'core@elevateoco.com'
);

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  created_at,
  updated_at,
  last_sign_in_at
)
select
  gen_random_uuid(),
  a.email,
  a.id,
  jsonb_build_object('sub', a.id::text, 'email', a.email, 'email_verified', true),
  'email',
  now(),
  now(),
  null
from auth.users a
where a.email = 'core@elevateoco.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = a.id and i.provider = 'email'
  );

update auth.users
set
  encrypted_password = extensions.crypt('password123', extensions.gen_salt('bf')),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('full_name', 'Core Member', 'must_change_password', true),
  updated_at = now()
where email = 'core@elevateoco.com';

update public.users u
set
  full_name = 'Core Member',
  role = 'lead',
  division_id = (select id from divisions where code = 'sales'),
  divisions = array['sales']::division_code[],
  manager_id = (select id from public.users where email = 'roy.neven@elevateoco.com'),
  is_active = true,
  updated_at = now()
where u.email = 'core@elevateoco.com';
