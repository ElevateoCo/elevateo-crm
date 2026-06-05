-- Command Center pinboard — per-user sticky notes pinned to a cork board.
-- Each note stores its text, colour, and position (as a percentage of the
-- board area so it stays put across screen sizes) plus a little rotation for
-- a natural pinned look. Notes are private to their owner.

create table if not exists sticky_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  body text not null default '',
  color text not null default 'yellow',
  x real not null default 8,
  y real not null default 8,
  rotation real not null default 0,
  z_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sticky_notes_user_idx on sticky_notes(user_id, z_index);

drop trigger if exists sticky_notes_updated on sticky_notes;
create trigger sticky_notes_updated
  before update on sticky_notes
  for each row execute function set_updated_at();

alter table sticky_notes enable row level security;

drop policy if exists sticky_notes_owner_all on sticky_notes;
create policy sticky_notes_owner_all on sticky_notes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
