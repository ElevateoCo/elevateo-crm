-- Admin IT functions + skin_tone column.

alter table users add column if not exists skin_tone text;

-- ============================================================
-- admin_create_user: provisions a new auth.users + public.users row.
-- ============================================================
create or replace function admin_create_user(
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
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  if exists (select 1 from auth.users where email = p_email) then
    raise exception 'A user with that email already exists.';
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
    crypt('password123', gen_salt('bf')),
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

  if p_division_code is not null then
    select id into v_division_id from divisions where code = p_division_code;
  end if;

  if p_manager_email is not null then
    select id into v_manager_id from public.users where email = p_manager_email;
  end if;

  update public.users
  set
    full_name   = p_full_name,
    role        = p_role,
    division_id = v_division_id,
    manager_id  = v_manager_id,
    divisions   = case when p_division_code is not null then array[p_division_code]::division_code[] else '{}'::division_code[] end,
    updated_at  = now()
  where id = v_user_id;

  return v_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- admin_delete_user: cascades through auth.users → public.users.
-- ============================================================
create or replace function admin_delete_user(p_user_id uuid) returns void as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- admin_reset_password: sets password to password123 + must_change_password.
-- ============================================================
create or replace function admin_reset_password(p_user_id uuid) returns void as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  update auth.users
  set
    encrypted_password = crypt('password123', gen_salt('bf')),
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || '{"must_change_password": true}'::jsonb,
    updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- admin_update_email: rewires auth.users, auth.identities, public.users.
-- ============================================================
create or replace function admin_update_email(p_user_id uuid, p_new_email text) returns void as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  if exists (select 1 from auth.users where email = p_new_email and id <> p_user_id) then
    raise exception 'A user with that email already exists.';
  end if;

  update auth.users set email = p_new_email, updated_at = now() where id = p_user_id;

  update auth.identities
  set
    provider_id   = p_new_email,
    identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(p_new_email)),
    updated_at    = now()
  where user_id = p_user_id and provider = 'email';

  update public.users set email = p_new_email, updated_at = now() where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- admin_update_full_name: keeps auth + public in sync.
-- ============================================================
create or replace function admin_update_full_name(p_user_id uuid, p_new_name text) returns void as $$
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  update auth.users
  set
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object('full_name', p_new_name),
    updated_at = now()
  where id = p_user_id;

  update public.users set full_name = p_new_name, updated_at = now() where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Grants: any authenticated user can call; functions guard via is_admin().
-- ============================================================
grant execute on function admin_create_user(text, text, user_role, division_code, text) to authenticated;
grant execute on function admin_delete_user(uuid) to authenticated;
grant execute on function admin_reset_password(uuid) to authenticated;
grant execute on function admin_update_email(uuid, text) to authenticated;
grant execute on function admin_update_full_name(uuid, text) to authenticated;
