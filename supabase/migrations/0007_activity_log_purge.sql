-- Auto-purge activity_log entries older than 14 days.

create extension if not exists pg_cron;

-- Unschedule if it exists already so this migration is idempotent.
do $$
begin
  perform cron.unschedule('purge-activity-log');
exception when others then
  null;
end$$;

select cron.schedule(
  'purge-activity-log',
  '0 3 * * *',
  $$ delete from public.activity_log where created_at < now() - interval '14 days' $$
);
