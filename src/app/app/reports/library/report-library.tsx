'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { WeeklyReport, WeeklyReportStatus } from '@/lib/supabase/types';
import { setWeeklyReportArchived } from '../actions';

const statusTone: Record<WeeklyReportStatus, 'default' | 'info' | 'success'> = {
  draft: 'default',
  submitted: 'info',
  reviewed: 'success',
};

function formatWeekRange(start: string, end: string) {
  const fmt = (v: string) =>
    new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(v));
  const year = new Date(start).getFullYear();
  return `Week of ${fmt(start)} – ${fmt(end)}, ${year}`;
}

function whereLabel(report: WeeklyReport, people: Record<string, string>): string {
  if (report.archived_at) return 'Archived';
  if (report.status === 'draft') return 'Draft - not submitted yet';
  if (report.status === 'submitted') {
    const reviewer = report.reviewer_id ? people[report.reviewer_id] : null;
    return reviewer ? `Awaiting review by ${reviewer}` : 'Awaiting review';
  }
  return 'Reviewed and rolled up';
}

function groupByWeek(reports: WeeklyReport[]) {
  const map = new Map<string, WeeklyReport[]>();
  for (const r of reports) {
    const list = map.get(r.week_start) ?? [];
    list.push(r);
    map.set(r.week_start, list);
  }
  // Newest week first.
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function SummaryBlock({ title, body }: { title: string; body: string | null | undefined }) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">{title}</div>
      <div className="whitespace-pre-wrap rounded-xl bg-[var(--color-surface-2)] p-3 font-sans text-[13px] leading-relaxed text-[var(--color-fg)]">
        {body?.trim() || 'Nothing added yet.'}
      </div>
    </div>
  );
}

function ReportSection({
  title,
  blurb,
  reports,
  people,
  counterpartOf,
  counterpartLabel,
  emptyText,
  onOpen,
}: {
  title: string;
  blurb: string;
  reports: WeeklyReport[];
  people: Record<string, string>;
  counterpartOf: (r: WeeklyReport) => string | null;
  counterpartLabel: string;
  emptyText: string;
  onOpen: (r: WeeklyReport) => void;
}) {
  const groups = useMemo(() => groupByWeek(reports), [reports]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="mt-1 text-[12px] text-[var(--color-fg-dim)]">{blurb}</div>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-[12px] text-[var(--color-fg-dim)]">
            {emptyText}
          </div>
        ) : (
          groups.map(([weekStart, weekReports]) => (
            <div key={weekStart} className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)]">
                {formatWeekRange(weekStart, weekReports[0].week_end)}
              </div>
              <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)]">
                {weekReports.map((report) => {
                  const counterpart = counterpartOf(report);
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => onOpen(report)}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[var(--color-surface-2)]"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium capitalize text-[var(--color-fg)]">
                          {report.division_code}
                        </div>
                        <div className="text-[11px] text-[var(--color-fg-dim)]">
                          {whereLabel(report, people)}
                          {counterpart ? ` · ${counterpartLabel}: ${counterpart}` : ''}
                        </div>
                      </div>
                      <Badge tone={report.archived_at ? 'default' : statusTone[report.status]}>
                        {report.archived_at ? 'archived' : report.status}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ReportLibrary({
  myReports,
  reviewReports,
  people,
}: {
  myReports: WeeklyReport[];
  reviewReports: WeeklyReport[];
  people: Record<string, string>;
}) {
  const [open, setOpen] = useState<WeeklyReport | null>(null);
  const [pending, start] = useTransition();

  function toggleArchive(report: WeeklyReport) {
    const archived = !report.archived_at;
    const fd = new FormData();
    fd.set('report_id', report.id);
    fd.set('archived', archived ? 'true' : 'false');
    start(async () => {
      const r = await setWeeklyReportArchived(fd);
      if (r?.error) {
        toast.error(r.error);
        return;
      }
      toast.success(archived ? 'Report archived' : 'Report restored');
      setOpen(null);
    });
  }

  const counterpartName = (id: string | null) => (id ? people[id] ?? null : null);

  return (
    <>
      <ReportSection
        title="My reports"
        blurb="Reports you authored, grouped by week. Click any report to open it."
        reports={myReports}
        people={people}
        counterpartOf={(r) => counterpartName(r.reviewer_id)}
        counterpartLabel="reviewer"
        emptyText="You have not created any reports yet."
        onOpen={setOpen}
      />

      <ReportSection
        title="Reports I review"
        blurb="Reports submitted by people who report into you, grouped by week."
        reports={reviewReports}
        people={people}
        counterpartOf={(r) => counterpartName(r.author_id)}
        counterpartLabel="from"
        emptyText="No reports route to you for review yet."
        onOpen={setOpen}
      />

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">
                  {open.division_code} weekly report
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
                  <span>{formatWeekRange(open.week_start, open.week_end)}</span>
                  <Badge tone={open.archived_at ? 'default' : statusTone[open.status]}>
                    {open.archived_at ? 'archived' : open.status}
                  </Badge>
                </div>
                <div className="text-[12px] text-[var(--color-fg-dim)]">
                  {whereLabel(open, people)}
                  {open.author_id && people[open.author_id]
                    ? ` · author: ${people[open.author_id]}`
                    : ''}
                </div>
              </DialogHeader>

              <div className="space-y-3">
                <SummaryBlock title="Auto Summary" body={open.auto_summary} />
                <SummaryBlock title="Manual Notes" body={open.manual_summary} />
                {open.reviewer_summary ? (
                  <SummaryBlock title="Reviewer Summary" body={open.reviewer_summary} />
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => toggleArchive(open)}
                >
                  {open.archived_at ? 'Unarchive' : 'Archive'}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
