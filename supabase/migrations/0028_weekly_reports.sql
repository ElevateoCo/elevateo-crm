alter type notification_type add value if not exists 'weekly_report';

create table if not exists weekly_reports (
  id uuid primary key default gen_random_uuid(),
  subject_user_id uuid not null references users(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  reviewer_id uuid references users(id) on delete set null,
  week_start date not null,
  week_end date not null,
  auto_summary text not null default '',
  manual_summary text,
  reviewer_summary text,
  status text not null default 'draft',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reports_status_check check (status in ('draft', 'submitted', 'reviewed')),
  constraint weekly_reports_author_week_unique unique (author_id, week_start)
);

create index if not exists weekly_reports_reviewer_idx on weekly_reports(reviewer_id, week_start, status);
create index if not exists weekly_reports_subject_idx on weekly_reports(subject_user_id, week_start);

drop trigger if exists weekly_reports_updated on weekly_reports;
create trigger weekly_reports_updated
  before update on weekly_reports
  for each row execute function set_updated_at();

alter table weekly_reports enable row level security;

drop policy if exists weekly_reports_read on weekly_reports;
create policy weekly_reports_read on weekly_reports
  for select using (
    auth.uid() = author_id
    or auth.uid() = reviewer_id
    or auth.uid() = subject_user_id
    or is_admin()
  );

drop policy if exists weekly_reports_insert on weekly_reports;
create policy weekly_reports_insert on weekly_reports
  for insert with check (auth.uid() = author_id or is_admin());

drop policy if exists weekly_reports_update on weekly_reports;
create policy weekly_reports_update on weekly_reports
  for update using (
    auth.uid() = author_id
    or auth.uid() = reviewer_id
    or is_admin()
  )
  with check (
    auth.uid() = author_id
    or auth.uid() = reviewer_id
    or is_admin()
  );

drop policy if exists weekly_reports_delete on weekly_reports;
create policy weekly_reports_delete on weekly_reports
  for delete using (auth.uid() = author_id or is_admin());
