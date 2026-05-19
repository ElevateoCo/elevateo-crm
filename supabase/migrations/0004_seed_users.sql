-- Seed Elevateo team into auth.users + public.users.
-- 1) Renames existing accounts to corrected emails (auth.users, auth.identities, public.users).
-- 2) Inserts placeholder accounts for externals/reservists/candidates.
-- 3) Resets every seeded user's password to 'password123' and flags must_change_password.
-- 4) Hydrates public.users with full_name, role, division, manager.
-- The middleware redirects flagged users to /change-password on next request.

-- ============================================================
-- 1) Rename existing accounts to the corrected email format.
-- ============================================================

create temp table _rename_map (old_email text primary key, new_email text not null unique) on commit drop;
insert into _rename_map values
  ('arnis@elevateoco.com',           'arnis.piekus@elevateoco.com'),
  ('bailey@elevateoco.com',          'bailey.barry@elevateoco.co.uk'),
  ('callum@elevateoco.com',          'callum.mcfarlen@elevateoco.com'),
  ('chase.buchanan@elevateoco.com',  'chasebuchanan201@gmail.com'),
  ('jeison@elevateoco.com',          'jeison.mulder@elevateoco.com'),
  ('julian@elevateoco.com',          'julianvdijk05@gmail.com'),
  ('lachie@elevateoco.com',          'lachlan.macdonald@elevateoco.com'),
  ('tanzeel.ahmad@elevateoco.com',   'tanzeel@elevateoco.com'),
  ('zuri.robledo@elevateoco.com',    'zuriel.robledo@elevateoco.com');

update auth.users a
set email = r.new_email
from _rename_map r
where a.email = r.old_email;

-- auth.identities.email is a generated column (lower(identity_data->>'email')),
-- so we only update identity_data + provider_id and let the generated column follow.
update auth.identities i
set
  provider_id   = r.new_email,
  identity_data = jsonb_set(coalesce(i.identity_data, '{}'::jsonb), '{email}', to_jsonb(r.new_email))
from _rename_map r
where i.provider_id = r.old_email and i.provider = 'email';

update public.users u
set email = r.new_email
from _rename_map r
where u.email = r.old_email;

-- ============================================================
-- 2) Roster definition.
-- ============================================================

create temp table _seed_users (
  email          text primary key,
  full_name      text not null,
  role           user_role not null,
  division_code  division_code,
  manager_email  text,
  extra_divisions division_code[] not null default '{}',
  is_active      boolean not null default true
) on commit drop;

insert into _seed_users (email, full_name, role, division_code, manager_email, extra_divisions) values
  -- CEO + Head of People
  ('allan.chan@elevateoco.com',       'Allan Chan',         'owner',     'admin',      null,                              array['admin','sales']::division_code[]),
  ('hazem.dweik@elevateoco.com',      'Hazem Dweik',        'owner',     'admin',      'allan.chan@elevateoco.com',       array['admin','sales','marketing','ecommerce']::division_code[]),

  -- Sales Division
  ('roy.neven@elevateoco.com',        'Roy Neven',          'lead',      'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),
  ('thomas.charrier@elevateoco.com',  'Thomas Charrier',    'lead',      'sales',      'roy.neven@elevateoco.com',        array['sales']::division_code[]),
  ('zuriel.robledo@elevateoco.com',   'Zuriel Robledo',     'lead',      'sales',      'roy.neven@elevateoco.com',        array['sales']::division_code[]),
  ('lachlan.macdonald@elevateoco.com','Lachlan Macdonald',  'lead',      'sales',      'roy.neven@elevateoco.com',        array['sales']::division_code[]),
  ('lewis.hayward@elevateoco.com',    'Lewis Hayward',      'lead',      'sales',      'roy.neven@elevateoco.com',        array['sales']::division_code[]),
  ('james.taylor@elevateoco.com',     'James Taylor',       'member',    'sales',      'roy.neven@elevateoco.com',        array['sales','marketing']::division_code[]),

  -- Marketing Division
  ('bailey.barry@elevateoco.co.uk',   'Bailey Barry',       'lead',      'marketing',  'hazem.dweik@elevateoco.com',      array['marketing','technology']::division_code[]),
  ('emil.larsen@elevateoco.com',      'Emil Larsen',        'lead',      'marketing',  'hazem.dweik@elevateoco.com',      array['marketing','technology','ecommerce']::division_code[]),
  ('julianvdijk05@gmail.com',         'Julian van Dijk',    'lead',      'marketing',  'hazem.dweik@elevateoco.com',      array['marketing','ecommerce']::division_code[]),

  -- Technology Division
  ('arnis.piekus@elevateoco.com',     'Arnis Piekus',       'lead',      'technology', 'allan.chan@elevateoco.com',       array['technology']::division_code[]),
  ('jeison.mulder@elevateoco.com',    'Jeison Mulder',      'member',    'technology', 'arnis.piekus@elevateoco.com',     array['technology']::division_code[]),
  ('tanzeel@elevateoco.com',          'Tanzeel Ahmad',      'member',    'technology', 'arnis.piekus@elevateoco.com',     array['technology']::division_code[]),
  ('chasebuchanan201@gmail.com',      'Chase Buchanan',     'member',    'technology', 'arnis.piekus@elevateoco.com',     array['technology']::division_code[]),
  ('callum.mcfarlen@elevateoco.com',  'Callum McFarlen',    'member',    'technology', 'arnis.piekus@elevateoco.com',     array['technology']::division_code[]),

  -- Sales externals under Hazem
  ('bisho@elevateoco.com',            'Bisho',              'member',    'sales',      'hazem.dweik@elevateoco.com',      array['sales','ecommerce']::division_code[]),
  ('tomoki@elevateoco.com',           'Tomoki',             'member',    'sales',      'hazem.dweik@elevateoco.com',      array['sales','ecommerce']::division_code[]),
  ('hamzah@elevateoco.com',           'Hamzah',             'member',    'sales',      'hazem.dweik@elevateoco.com',      array['sales']::division_code[]),
  ('aziz@elevateoco.com',             'Aziz',               'member',    'sales',      'hazem.dweik@elevateoco.com',      array['sales']::division_code[]),

  -- Partner / Core under Thomas
  ('nathan@elevateoco.com',           'Nathan',             'member',    'sales',      'thomas.charrier@elevateoco.com',  array['sales']::division_code[]),

  -- Candidate under Zuriel
  ('leo.ioannidis@elevateoco.com',    'Leo Ioannidis',      'member',    'sales',      'zuriel.robledo@elevateoco.com',   array['sales']::division_code[]),

  -- Field Sales Agents under Allan
  ('cory.mcguckin@elevateoco.com',    'Cory McGuckin',      'member',    'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),
  ('gerrard.mcferran@elevateoco.com', 'Gerrard McFerran',   'member',    'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),
  ('etkc@elevateoco.com',             'ETKC',               'member',    'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),
  ('yonalle@elevateoco.com',          'Yonalle',            'member',    'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),
  ('nicky@elevateoco.com',            'Nicky',              'member',    'sales',      'allan.chan@elevateoco.com',       array['sales']::division_code[]),

  -- Rosey Co reservists under Bailey
  ('barry.brother@elevateoco.com',    'Barry''s Brother',   'reservist', 'marketing',  'bailey.barry@elevateoco.co.uk',   array['marketing']::division_code[]),
  ('valdas@elevateoco.com',           'Valdas',             'reservist', 'marketing',  'bailey.barry@elevateoco.co.uk',   array['marketing']::division_code[]),
  ('kelvin@elevateoco.com',           'Kelvin',             'reservist', 'marketing',  'bailey.barry@elevateoco.co.uk',   array['marketing']::division_code[]),
  ('james.reservist@elevateoco.com',  'James (Reservist)',  'reservist', 'marketing',  'bailey.barry@elevateoco.co.uk',   array['marketing']::division_code[]),

  -- E-commerce affiliates under Julian
  ('ross@elevateoco.com',             'Ross',               'member',    'ecommerce',  'julianvdijk05@gmail.com',         array['ecommerce']::division_code[]),
  ('matt@elevateoco.com',             'Matt',               'member',    'ecommerce',  'julianvdijk05@gmail.com',         array['ecommerce']::division_code[]),
  ('mantas@elevateoco.com',           'Mantas',             'member',    'ecommerce',  'julianvdijk05@gmail.com',         array['ecommerce']::division_code[]),

  -- Partner / Other
  ('ratan@elevateoco.com',            'Ratan',              'member',    'ecommerce',  'hazem.dweik@elevateoco.com',      array['ecommerce']::division_code[]);

-- ============================================================
-- 3) Insert auth.users for any seed row that doesn't exist.
--    The handle_new_user trigger creates the matching public.users row.
-- ============================================================

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
  s.email,
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'full_name', s.full_name,
    'must_change_password', true
  ),
  now(),
  now(),
  '',
  '',
  '',
  ''
from _seed_users s
where not exists (select 1 from auth.users a where a.email = s.email);

-- Add matching auth.identities rows for new auth.users (Supabase password sign-in needs this).
-- Note: auth.identities.email is a generated column; do not insert into it directly.
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
join _seed_users s on s.email = a.email
where not exists (
  select 1 from auth.identities i
  where i.user_id = a.id and i.provider = 'email'
);

-- ============================================================
-- 4) Reset password + must_change_password for every seeded user
--    (existing and new). Keeps Hazem in since the user asked to
--    flag every team member.
-- ============================================================

update auth.users a
set
  encrypted_password = crypt('password123', gen_salt('bf')),
  raw_user_meta_data = coalesce(a.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object(
         'full_name', s.full_name,
         'must_change_password', true
       ),
  updated_at = now()
from _seed_users s
where a.email = s.email;

-- ============================================================
-- 5) Hydrate public.users with hierarchy info.
-- ============================================================

update public.users u
set
  full_name   = s.full_name,
  role        = s.role,
  division_id = (select id from divisions where code = s.division_code),
  divisions   = s.extra_divisions,
  manager_id  = (select id from public.users where email = s.manager_email),
  is_active   = s.is_active,
  updated_at  = now()
from _seed_users s
where u.email = s.email;

-- ============================================================
-- 6) Division owners (used by /app/admin/divisions UI).
-- ============================================================

update divisions d set owner_id = (select id from public.users where email = 'roy.neven@elevateoco.com')
  where d.code = 'sales';
update divisions d set owner_id = (select id from public.users where email = 'hazem.dweik@elevateoco.com')
  where d.code = 'marketing';
update divisions d set owner_id = (select id from public.users where email = 'arnis.piekus@elevateoco.com')
  where d.code = 'technology';
update divisions d set owner_id = (select id from public.users where email = 'hazem.dweik@elevateoco.com')
  where d.code = 'ecommerce';
update divisions d set owner_id = (select id from public.users where email = 'allan.chan@elevateoco.com')
  where d.code = 'admin';
