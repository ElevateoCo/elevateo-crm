import type { OnboardingStage, User, UserOnboardingChecklist } from '@/lib/supabase/types';

export const onboardingStageOrder: Record<OnboardingStage, number> = {
  working: 0,
  onboarded: 1,
  sent_material: 2,
  interviewed: 3,
  contacted: 4,
  interested: 5,
  active: 6,
  not_contacted: 7,
  backup: 8,
  paused: 9,
};

export const onboardingSteps = [
  'questionnaire',
  'contract_signed',
  'start_here',
  'sales_training',
  'pricing_products',
  'ready_to_sell',
] as const;

export type OnboardingStep = (typeof onboardingSteps)[number];

export const onboardingShortLabels: Record<OnboardingStep, string> = {
  questionnaire: 'Questionnaire',
  contract_signed: 'Contract',
  start_here: '01-Start',
  sales_training: '02-Sales',
  pricing_products: '03-Pricing',
  ready_to_sell: 'Go Live',
};

export const onboardingStepDetails: Record<OnboardingStep, string> = {
  questionnaire: 'Send questionnaire (fill out before day 1)',
  contract_signed: 'Send contract + NDA + non-compete to sign',
  start_here: 'Week 1: Complete folder 01 (overview, checklist, training manual)',
  sales_training: 'Week 1: Complete folder 02 (scripts, objections, outreach, Hormozi)',
  pricing_products: 'Week 2: Complete folders 03+05 (pricing, packages, proposals)',
  ready_to_sell: 'Mock call + approve to go live (30 reach-outs/day target)',
};

export const defaultOnboardingChecklist: UserOnboardingChecklist = {
  questionnaire: false,
  contract_signed: false,
  start_here: false,
  sales_training: false,
  pricing_products: false,
  ready_to_sell: false,
};

export function normalizeChecklist(
  checklist: UserOnboardingChecklist | null | undefined,
): UserOnboardingChecklist {
  return {
    ...defaultOnboardingChecklist,
    ...(checklist ?? {}),
  };
}

export function onboardingProgress(user: Pick<User, 'onboarding_checklist'>) {
  const checklist = normalizeChecklist(user.onboarding_checklist);
  const done = onboardingSteps.filter((step) => checklist[step]).length;
  return Math.round((done / onboardingSteps.length) * 100);
}

export function nextStepForUser(user: Pick<User, 'onboarding_stage' | 'onboarding_checklist'>) {
  const stage = user.onboarding_stage ?? 'not_contacted';
  const checklist = normalizeChecklist(user.onboarding_checklist);
  switch (stage) {
    case 'not_contacted':
      return { label: 'Reach out to them', tone: 'text-cyan-400' };
    case 'interested':
      return { label: 'Schedule interview call', tone: 'text-amber-400' };
    case 'contacted':
      return { label: 'Do interview and assess fit', tone: 'text-sky-400' };
    case 'interviewed':
      return { label: 'Send acceptance message + onboarding pack', tone: 'text-teal-400' };
    case 'sent_material': {
      const first = onboardingSteps.find((step) => !checklist[step]);
      if (first) return { label: onboardingStepDetails[first], tone: 'text-indigo-400' };
      return { label: 'All onboarding complete. Mark as onboarded.', tone: 'text-indigo-400' };
    }
    case 'onboarded':
      return { label: 'Approve to sell and set daily targets', tone: 'text-blue-400' };
    case 'working':
      return { label: 'Track reach-outs, convos, and booked calls', tone: 'text-emerald-400' };
    case 'active':
      return { label: 'Active and running', tone: 'text-emerald-400' };
    case 'paused':
      return { label: 'Follow up and re-engage', tone: 'text-zinc-400' };
    case 'backup':
      return { label: 'On standby', tone: 'text-violet-400' };
  }
}

export function getManagedUsers(viewerId: string, users: User[]) {
  const childrenByManager = new Map<string, User[]>();
  for (const user of users) {
    if (!user.manager_id) continue;
    const list = childrenByManager.get(user.manager_id) ?? [];
    list.push(user);
    childrenByManager.set(user.manager_id, list);
  }

  const managed: User[] = [];
  const queue = [...(childrenByManager.get(viewerId) ?? [])];
  const seen = new Set<string>();

  while (queue.length) {
    const current = queue.shift()!;
    if (seen.has(current.id)) continue;
    seen.add(current.id);
    managed.push(current);
    for (const child of childrenByManager.get(current.id) ?? []) queue.push(child);
  }

  return managed;
}
