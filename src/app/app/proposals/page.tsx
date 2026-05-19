import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function ProposalsPage() {
  return (
    <div>
      <PageHeader
        title="Proposals"
        description="Outbound proposals, scopes, and pricing decks across all divisions."
      />

      <div className="p-7">
        <Card className="p-10 bg-white text-center">
          <div className="mx-auto max-w-md">
            <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">Connecting soon</h2>
            <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
              The proposals dashboard will live here. Once connected, every active proposal,
              status, and decision will be visible in one place.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
