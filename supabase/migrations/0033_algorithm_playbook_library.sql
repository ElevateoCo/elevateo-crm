insert into libraries (slug, name, category, description, url, sort_order)
values (
  'algorithm-playbook-2026',
  'Algorithm Playbook 2026',
  'Marketing',
  'Social platform algorithm playbook and operating guidance for 2026.',
  'https://docs.google.com/document/d/1FoiOQ9aZhBowdA58pQ3i-QMqWyK5yM_b/preview',
  11
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
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
where l.slug = 'algorithm-playbook-2026'
on conflict do nothing;
