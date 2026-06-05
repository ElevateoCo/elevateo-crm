alter table libraries
add column if not exists category text not null default 'General';

update libraries
set category = case slug
  when 'onboarding' then 'People & Onboarding'
  when 'pope-trw-social-media-system' then 'Marketing'
  else coalesce(nullif(trim(category), ''), 'General')
end;
