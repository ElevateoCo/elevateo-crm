-- Daily habits — per-user repeating tasks that don't stack across days.
-- A habit is "done today" if a habit_completions row exists with today's date.
-- No carry-over: yesterday's incompletion does nothing; tomorrow starts fresh.

create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  sort_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index habits_user_idx on habits(user_id, sort_index);

create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

create index habit_completions_lookup_idx on habit_completions(user_id, completed_on);

alter table habits enable row level security;
alter table habit_completions enable row level security;

create policy habits_owner_all on habits for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy completions_owner_all on habit_completions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Optional: purge habit_completions older than 60 days nightly to keep the table tidy.
do $$
begin
  perform cron.unschedule('purge-habit-completions');
exception when others then null;
end$$;

select cron.schedule(
  'purge-habit-completions',
  '0 5 * * *',
  $$ delete from habit_completions where completed_on < current_date - interval '60 days' $$
);
