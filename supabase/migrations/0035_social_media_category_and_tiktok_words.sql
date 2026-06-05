update libraries
set category = 'Social Media'
where slug in (
  'pope-trw-social-media-system',
  'algorithm-playbook-2026'
);

insert into libraries (slug, name, category, description, url, sort_order)
values (
  'tiktok-blacklisted-shadowban-words',
  'TikTok Blacklisted & Shadowban Words',
  'Social Media',
  'Reference guide for risky TikTok words, safer alternatives, hashtags, and shadowban prevention.',
  'https://docs.google.com/document/d/15hmwAGA9SJesJaQk0xJJxjb0ZVGKZGH0/preview',
  12
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
where l.slug = 'tiktok-blacklisted-shadowban-words'
on conflict do nothing;
