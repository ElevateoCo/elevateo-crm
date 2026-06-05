-- Let reviewers archive weekly reports to clear their review queue without
-- deleting the record. Archived reports drop out of the active review/team
-- lists and surface under a dedicated "Archived" section instead.

alter table weekly_reports
  add column if not exists archived_at timestamptz;

create index if not exists weekly_reports_archived_idx
  on weekly_reports(reviewer_id, archived_at);
