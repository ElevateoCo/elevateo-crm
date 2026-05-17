alter table users
  add column if not exists cold_call_goal integer not null default 40;
