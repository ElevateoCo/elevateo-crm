insert into libraries (slug, name, description, url, sort_order)
values (
  'pope-trw-social-media-system',
  'Pope TRW Social Media System',
  'Social media system and operating guide, updated June 2026.',
  '/library/pope-trw-social-media-system-jun-2026.pdf',
  10
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  url = excluded.url,
  sort_order = excluded.sort_order;

insert into library_access (library_id, role)
select l.id, access_role.role
from libraries l
cross join (
  values
    ('owner'::user_role),
    ('executive'::user_role),
    ('lead'::user_role),
    ('member'::user_role),
    ('reservist'::user_role),
    ('external'::user_role)
) as access_role(role)
where l.slug = 'pope-trw-social-media-system'
on conflict do nothing;
