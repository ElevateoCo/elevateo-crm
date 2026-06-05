-- Let sticky notes be resized. Width/height are stored in pixels; the drag
-- layer keeps position in percentages so notes stay put across screen sizes.

alter table sticky_notes
  add column if not exists w real not null default 160,
  add column if not exists h real not null default 160;
