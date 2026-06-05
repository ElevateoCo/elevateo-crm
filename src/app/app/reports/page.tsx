import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserPill } from '@/components/shared/user-pill';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
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
  Project,
  Task,
  TaskComment,
  WeeklyReport,
  WeeklyReportStatus,
} from '@/lib/supabase/types';
import { reviewWeeklyReport, setWeeklyReportArchived, upsertMyWeeklyReport } from './actions';

const statusTone: Record<WeeklyReportStatus, 'default' | 'info' | 'success'> = {
  draft: 'default',
  submitted: 'info',
  reviewed: 'success',
};

export const dynamic = 'force-dynamic';

function SummaryBlock({ title, body }: { title: string; body: string | null | undefined }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">{title}</div>
      <div className="whitespace-pre-wrap rounded-xl bg-[var(--color-surface-2)] p-3 font-sans text-[13px] leading-relaxed text-[var(--color-fg)]">
        {body?.trim() || 'Nothing added yet.'}
      </div>
    </div>
  );
}

export default async function WeeklyReportsPage() {
  async function submitMyReport(formData: FormData) {
    'use server';
    await upsertMyWeeklyReport(formData);
  }

  async function submitReview(formData: FormData) {
    'use server';
    await reviewWeeklyReport(formData);
  }

  async function submitArchive(formData: FormData) {
    'use server';
    await setWeeklyReportArchived(formData);
  }

  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const week = getCurrentWeekRange();

  const [users, divisions, tasksRaw, approvalsRaw, commentsRaw, activityRaw, projectsRaw, reportsRaw] =
    await Promise.all([
      getAllUsers(),
      getDivisions(),
      supabase.from('tasks').select('*'),
      supabase.from('approvals').select('*'),
      supabase.from('task_comments').select('*'),
      supabase.from('activity_log').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('weekly_reports').select('*').eq('week_start', week.start).order('created_at'),
    ]);

  const tasks = (tasksRaw.data ?? []) as Task[];
  const approvals = (approvalsRaw.data ?? []) as Approval[];
  const comments = (commentsRaw.data ?? []) as TaskComment[];
  const activity = (activityRaw.data ?? []) as ActivityLogEntry[];
  const projects = (projectsRaw.data ?? []) as Project[];
  const reports = (reportsRaw.data ?? []) as WeeklyReport[];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const reportDivisions = getDivisionReportContexts(profile);

  const pendingReviews = reports.filter(
    (report) =>
      report.reviewer_id === profile.id &&
      report.author_id !== profile.id &&
      report.status === 'submitted' &&
      !report.archived_at,
  );
  const teamReports = reports.filter(
    (report) =>
      report.reviewer_id === profile.id && report.author_id !== profile.id && !report.archived_at,
  );

  return (
    <div>
      <PageHeader
        title="Weekly Reports"
        description="Division-by-division weekly summaries plus manual notes. Submit each lane upward so leadership gets clean roll-ups."
        meta={
          <div className="flex items-center gap-4">
            <span className="text-xs text-[var(--color-fg-muted)]">
              Week {week.startLabel} - {week.endLabel}
            </span>
            <Link
              href="/app/reports/library"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]"
            >
              Reports library <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        }
      />

      <div className="space-y-4 p-6">
        {reportDivisions.map((division) => {
          const reviewedChildReports = reports.filter(
            (report) =>
              report.reviewer_id === profile.id &&
              report.author_id !== profile.id &&
              report.division_code === division.code &&
              report.status === 'reviewed',
          );
          const digest = buildWeeklyDigest(
            profile,
            division.code,
            week,
            tasks,
            approvals,
            comments,
            activity,
            projects,
          );
          const autoSummary = buildAutoSummary({
            subject: profile,
            divisionLabel: division.label,
            week,
            digest,
            projects,
            childReports: reviewedChildReports,
          });
          const report = reports.find(
            (entry) => entry.author_id === profile.id && entry.division_code === division.code,
          );
          const reviewer = getReviewerForDivision(profile, division.code, users, divisions);

          return (
            <Card key={division.code}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{division.label} Weekly Report</CardTitle>
                  <div className="mt-1 text-[12px] text-[var(--color-fg-dim)]">
                    Auto summary is scoped to {division.label.toLowerCase()} work. Add context manually, then send it upward.
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Badge tone={statusTone[report?.status ?? 'draft']}>
                    {(report?.status ?? 'draft').replace('_', ' ')}
                  </Badge>
                  <div className="text-[11px] text-[var(--color-fg-dim)]">
                    Reviewer: {reviewer ? reviewer.full_name : 'No higher reviewer'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <SummaryBlock title="Auto Summary" body={autoSummary} />
                <form action={submitMyReport} className="space-y-3">
                  <input type="hidden" name="division_code" value={division.code} />
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                      Manual Notes
                    </div>
                    <Textarea
                      name="manual_summary"
                      rows={8}
                      defaultValue={report?.manual_summary ?? ''}
                      placeholder="Add context that the CRM cannot infer: blockers, decisions, off-platform work, concerns, wins."
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button type="submit" name="intent" value="save" variant="secondary">
                      Save draft
                    </Button>
                    <Button type="submit" name="intent" value="submit">
                      {reviewer ? 'Submit upward' : 'Finalize report'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          );
        })}

        <Card>
          <CardHeader>
            <CardTitle>Reports Awaiting My Review</CardTitle>
            <div className="mt-1 text-[12px] text-[var(--color-fg-dim)]">
              These division summaries were submitted by people who report into you. Review them, add notes, then use them in your own roll-up.
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[12px] text-[var(--color-fg-dim)]">
                No submitted reports are waiting on you right now.
              </div>
            ) : (
              pendingReviews.map((report) => {
                const author = userMap.get(report.author_id) ?? null;
                return (
                  <div key={report.id} className="rounded-xl border border-[var(--color-border)] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserPill user={author} />
                        <Badge tone="info">Submitted</Badge>
                      </div>
                      <div className="text-[11px] text-[var(--color-fg-dim)]">
                        {report.division_code} · submitted {report.submitted_at?.slice(0, 10) ?? week.end}
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <SummaryBlock title="Auto Summary" body={report.auto_summary} />
                      <SummaryBlock title="Manual Notes" body={report.manual_summary} />
                    </div>
                    <form action={submitReview} className="mt-4 space-y-3">
                      <input type="hidden" name="report_id" value={report.id} />
                      <Textarea
                        name="reviewer_summary"
                        rows={5}
                        defaultValue={report.reviewer_summary ?? ''}
                        placeholder="Add your reviewer notes, decisions, and the clean summary that should count upward."
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button type="submit">Mark reviewed</Button>
                      </div>
                    </form>
                    <form action={submitArchive} className="mt-2 flex justify-end">
                      <input type="hidden" name="report_id" value={report.id} />
                      <input type="hidden" name="archived" value="true" />
                      <Button type="submit" variant="ghost" size="sm">
                        Archive
                      </Button>
                    </form>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reviewed Team Summaries</CardTitle>
            <div className="mt-1 text-[12px] text-[var(--color-fg-dim)]">
              These reviewed division reports are already feeding into your own roll-ups.
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamReports.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[12px] text-[var(--color-fg-dim)]">
                Nobody in your reporting line has created a report for this week yet.
              </div>
            ) : (
              teamReports.map((report) => {
                const author = userMap.get(report.author_id) ?? null;
                return (
                  <div key={report.id} className="rounded-xl border border-[var(--color-border)] p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserPill user={author} />
                        <Badge tone={statusTone[report.status]}>{report.status}</Badge>
                      </div>
                      <div className="text-[11px] text-[var(--color-fg-dim)]">
                        {report.division_code} · week {report.week_start} - {report.week_end}
                      </div>
                    </div>
                    <SummaryBlock
                      title="Reviewer Summary"
                      body={report.reviewer_summary || report.manual_summary || report.auto_summary}
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
