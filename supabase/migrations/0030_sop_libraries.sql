-- SOP libraries: access-controlled links. Each library is a card that opens an
-- external resource (e.g. a Google Drive folder) in a new tab. Access is granted
-- per role: owners / admin-division (is_admin()) always have access and manage
-- it; every other role needs a row in library_access.

create table if not exists libraries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null default '',
  url text not null default '',  -- external link opened when the card is clicked
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists library_access (
  library_id uuid not null references libraries(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  primary key (library_id, role)
);

alter table libraries enable row level security;
alter table library_access enable row level security;

-- Read: admins see everything; others see libraries granted to their role.
create policy libraries_select on libraries for select using (
  is_admin() or exists (
    select 1 from library_access a
    where a.library_id = libraries.id and a.role = my_role()
  )
);

-- Access rows: admins manage all; a user may read grants for their own role.
create policy library_access_select on library_access for select using (
  is_admin() or role = my_role()
);

-- Writes are admin-only.
create policy libraries_write on libraries for all using (is_admin()) with check (is_admin());
create policy library_access_write on library_access for all using (is_admin()) with check (is_admin());

-- ---- Seed -----------------------------------------------------------------

insert into libraries (slug, name, description, url, sort_order) values
  ('onboarding', 'Onboarding', 'Signing pack and starter documents for new partners.',
   'https://drive.google.com/drive/folders/16osvRcD8v73gYrtQ35bI7ynsKA-P7Z5i', 0)
on conflict (slug) do nothing;

-- Grant onboarding to the operational roles (owners/admins always have access).
insert into library_access (library_id, role)
select l.id, r.role
from libraries l
cross join (values ('executive'::user_role), ('lead'::user_role), ('member'::user_role)) as r(role)
where l.slug = 'onboarding'
on conflict do nothing;
