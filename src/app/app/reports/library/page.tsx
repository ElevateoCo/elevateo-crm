import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, requireCurrentUser } from '@/lib/queries';
import type { WeeklyReport } from '@/lib/supabase/types';
import { ReportLibrary } from './report-library';

export const dynamic = 'force-dynamic';

export default async function ReportsLibraryPage() {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const users = await getAllUsers();
  const people = Object.fromEntries(users.map((user) => [user.id, user.full_name]));

  const { data: libraryRaw } = await supabase
    .from('weekly_reports')
    .select('*')
    .or(`author_id.eq.${profile.id},reviewer_id.eq.${profile.id}`)
    .order('week_start', { ascending: false })
    .order('division_code', { ascending: true });
  const libraryReports = (libraryRaw ?? []) as WeeklyReport[];
  const myReports = libraryReports.filter((report) => report.author_id === profile.id);
  const reviewReports = libraryReports.filter(
    (report) => report.reviewer_id === profile.id && report.author_id !== profile.id,
  );

  return (
    <div>
      <PageHeader
        title="Reports Library"
        description="Every weekly report you have authored or review, grouped by week. Click a report to open it."
        meta={
          <Link
            href="/app/reports"
            className="inline-flex items-center gap-1.5 text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
          </Link>
        }
      />

      <div className="space-y-4 p-6">
        <ReportLibrary myReports={myReports} reviewReports={reviewReports} people={people} />
      </div>
    </div>
  );
}
