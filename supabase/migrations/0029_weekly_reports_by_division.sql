alter table weekly_reports
  add column if not exists division_code division_code;

update weekly_reports wr
set division_code = u.divisions[1]
from users u
where u.id = wr.author_id
  and wr.division_code is null;

alter table weekly_reports
  alter column division_code set not null;

alter table weekly_reports
  drop constraint if exists weekly_reports_author_week_unique;

alter table weekly_reports
  add constraint weekly_reports_author_week_division_unique unique (author_id, week_start, division_code);

drop index if exists weekly_reports_reviewer_idx;
create index if not exists weekly_reports_reviewer_idx
  on weekly_reports(reviewer_id, division_code, week_start, status);

drop index if exists weekly_reports_subject_idx;
create index if not exists weekly_reports_subject_idx
  on weekly_reports(subject_user_id, division_code, week_start);
