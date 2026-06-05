update users
set
  onboarding_stage = 'not_contacted',
  onboarding_checklist = jsonb_build_object(
    'questionnaire', false,
    'contract_signed', false,
    'start_here', false,
    'sales_training', false,
    'pricing_products', false,
    'ready_to_sell', false
  ),
  updated_at = now()
where role in ('external', 'reservist');
