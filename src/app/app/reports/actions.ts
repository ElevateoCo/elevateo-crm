'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getDivisions, requireCurrentUser } from '@/lib/queries';
import {
  buildAutoSummary,
  buildWeeklyDigest,
  getCurrentWeekRange,
  getDivisionReportContexts,
  getReviewerForDivision,
} from '@/lib/weekly-reports';
import type {
  ActivityLogEntry,
  Approval,
  DivisionCode,
  Project,
  Task,
  TaskComment,
  User,
  WeeklyReport,
} from '@/lib/supabase/types';

const DivisionCodes = ['sales', 'marketing', 'technology', 'ecommerce', 'admin'] as const;

const UpsertSchema = z.object({
  division_code: z.enum(DivisionCodes),
  manual_summary: z.string().max(12000).optional(),
  intent: z.enum(['save', 'submit']),
});

const ReviewSchema = z.object({
  report_id: z.string().uuid(),
  reviewer_summary: z.string().max(12000).optional(),
});

const ArchiveSchema = z.object({
  report_id: z.string().uuid(),
  archived: z.enum(['true', 'false']),
});

async function loadWeeklyContext() {
  const supabase = await createClient();
  const week = getCurrentWeekRange();
  const [usersRaw, divisions, tasksRaw, approvalsRaw, commentsRaw, activityRaw, projectsRaw, reportsRaw] =
    await Promise.all([
      supabase.from('users').select('*').order('full_name'),
      getDivisions(),
      supabase.from('tasks').select('*'),
      supabase.from('approvals').select('*'),
      supabase.from('task_comments').select('*'),
      supabase.from('activity_log').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('weekly_reports').select('*').eq('week_start', week.start).order('created_at'),
    ]);

  return {
    supabase,
    week,
    users: (usersRaw.data ?? []) as User[],
    divisions,
    tasks: (tasksRaw.data ?? []) as Task[],
    approvals: (approvalsRaw.data ?? []) as Approval[],
    comments: (commentsRaw.data ?? []) as TaskComment[],
    activity: (activityRaw.data ?? []) as ActivityLogEntry[],
    projects: (projectsRaw.data ?? []) as Project[],
    reports: (reportsRaw.data ?? []) as WeeklyReport[],
  };
}

function buildReportPayload(args: {
  profile: User;
  divisionCode: DivisionCode;
  users: User[];
  divisions: Awaited<ReturnType<typeof getDivisions>>;
  tasks: Task[];
  approvals: Approval[];
  comments: TaskComment[];
  activity: ActivityLogEntry[];
  projects: Project[];
  reports: WeeklyReport[];
}) {
  const { profile, divisionCode, users, divisions, tasks, approvals, comments, activity, projects, reports } = args;
  const week = getCurrentWeekRange();
  const divisionLabel =
    getDivisionReportContexts(profile).find((entry) => entry.code === divisionCode)?.label ?? divisionCode;
  const childReports = reports.filter(
    (report) =>
      report.reviewer_id === profile.id &&
      report.author_id !== profile.id &&
      report.division_code === divisionCode &&
      report.status === 'reviewed',
  );
  const digest = buildWeeklyDigest(profile, divisionCode, week, tasks, approvals, comments, activity, projects);
  const autoSummary = buildAutoSummary({
    subject: profile,
    divisionLabel,
    week,
    digest,
    projects,
    childReports,
  });
  const reviewer = getReviewerForDivision(profile, divisionCode, users, divisions);

  return {
    week,
    divisionLabel,
    autoSummary,
    reviewerId: reviewer?.id ?? null,
  };
}

export async function upsertMyWeeklyReport(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = UpsertSchema.safeParse({
    division_code: formData.get('division_code'),
    manual_summary: formData.get('manual_summary') || '',
    intent: formData.get('intent'),
  });
  if (!parsed.success) return { error: 'Invalid report input.' };

  const { supabase, users, divisions, tasks, approvals, comments, activity, projects, reports } =
    await loadWeeklyContext();
  const validDivisions = new Set(getDivisionReportContexts(profile).map((entry) => entry.code));
  if (!validDivisions.has(parsed.data.division_code)) return { error: 'Invalid division report.' };

  const { week, divisionLabel, autoSummary, reviewerId } = buildReportPayload({
    profile,
    divisionCode: parsed.data.division_code,
    users,
    divisions,
    tasks,
    approvals,
    comments,
    activity,
    projects,
    reports,
  });

  const submitting = parsed.data.intent === 'submit';
  const status = submitting ? (reviewerId ? 'submitted' : 'reviewed') : 'draft';
  const submittedAt = submitting ? new Date().toISOString() : null;
  const reviewedAt = submitting && !reviewerId ? new Date().toISOString() : null;

  const payload = {
    subject_user_id: profile.id,
    author_id: profile.id,
    reviewer_id: reviewerId,
    division_code: parsed.data.division_code,
    week_start: week.start,
    week_end: week.end,
    auto_summary: autoSummary,
    manual_summary: parsed.data.manual_summary || null,
    reviewer_summary: null,
    status,
    submitted_at: submittedAt,
    reviewed_at: reviewedAt,
  };

  const { data: report, error } = await supabase
    .from('weekly_reports')
    .upsert(payload, { onConflict: 'author_id,week_start,division_code' })
    .select('*')
    .single();
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'weekly_report',
    entity_id: report.id,
    actor_id: profile.id,
    action: submitting
      ? `submitted ${parsed.data.division_code} weekly report`
      : `saved ${parsed.data.division_code} weekly report draft`,
  });

  if (submitting && reviewerId) {
    await supabase.from('notifications').insert({
      user_id: reviewerId,
      actor_id: profile.id,
      type: 'weekly_report',
      title: `${profile.full_name} submitted a ${divisionLabel} weekly report`,
      body: `Week of ${week.start} to ${week.end}. Review the ${divisionLabel.toLowerCase()} summary and roll it up.`,
      link: '/app/reports',
    });
  }

  revalidatePath('/app/reports');
  revalidatePath('/app/inbox');
  return { ok: true };
}

export async function reviewWeeklyReport(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = ReviewSchema.safeParse({
    report_id: formData.get('report_id'),
    reviewer_summary: formData.get('reviewer_summary') || '',
  });
  if (!parsed.success) return { error: 'Invalid review input.' };

  const supabase = await createClient();
  const { data: report, error: loadError } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', parsed.data.report_id)
    .maybeSingle();
  if (loadError || !report) return { error: loadError?.message ?? 'Report not found.' };
  if (report.reviewer_id !== profile.id) return { error: 'Not authorized to review this report.' };

  const { error } = await supabase
    .from('weekly_reports')
    .update({
      reviewer_summary: parsed.data.reviewer_summary || null,
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', report.id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'weekly_report',
    entity_id: report.id,
    actor_id: profile.id,
    action: `reviewed ${report.division_code} weekly report`,
  });

  await supabase.from('notifications').insert({
    user_id: report.author_id,
    actor_id: profile.id,
    type: 'weekly_report',
    title: `${profile.full_name} reviewed your ${report.division_code} weekly report`,
    body: 'Your division report has been reviewed and can now be included in the next roll-up.',
    link: '/app/reports',
  });

  revalidatePath('/app/reports');
  revalidatePath('/app/inbox');
  return { ok: true };
}

export async function setWeeklyReportArchived(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = ArchiveSchema.safeParse({
    report_id: formData.get('report_id'),
    archived: formData.get('archived'),
  });
  if (!parsed.success) return { error: 'Invalid archive input.' };

  const supabase = await createClient();
  const { data: report, error: loadError } = await supabase
    .from('weekly_reports')
    .select('id, reviewer_id, author_id')
    .eq('id', parsed.data.report_id)
    .maybeSingle();
  if (loadError || !report) return { error: loadError?.message ?? 'Report not found.' };
  if (report.reviewer_id !== profile.id && report.author_id !== profile.id) {
    return { error: 'Not authorized to archive this report.' };
  }

  const { error } = await supabase
    .from('weekly_reports')
    .update({ archived_at: parsed.data.archived === 'true' ? new Date().toISOString() : null })
    .eq('id', report.id);
  if (error) return { error: error.message };

  revalidatePath('/app/reports');
  return { ok: true };
}
