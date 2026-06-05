create or replace function is_admin() returns boolean as $$
  select exists(
    select 1
    from users u
    left join divisions d on d.id = u.division_id
    where u.id = auth.uid()
      and (
        u.role = 'owner'
        or d.code = 'admin'
        or lower(u.email) in (
          'allan.chan@elevateoco.com',
          'hazem.dweik@elevateoco.com',
          'arnis.piekus@elevateoco.com',
          'bailey.barry@elevateoco.co.uk',
          'arnis@elevateoco.com',
          'bailey@elevateoco.com'
        )
      )
  );
$$ language sql stable security definer;
