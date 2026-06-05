alter table users
  add column if not exists onboarding_stage text default 'not_contacted',
  add column if not exists onboarding_checklist jsonb not null default jsonb_build_object(
    'questionnaire', false,
    'contract_signed', false,
    'start_here', false,
    'sales_training', false,
    'pricing_products', false,
    'ready_to_sell', false
  );

update users
set onboarding_stage = case
  when onboarding_stage is null and role = 'external' then 'interested'
  when onboarding_stage is null and role in ('member', 'reservist') then 'working'
  when onboarding_stage is null and role in ('lead', 'executive', 'owner') then 'active'
  else onboarding_stage
end;
