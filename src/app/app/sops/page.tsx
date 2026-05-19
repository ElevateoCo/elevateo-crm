import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function SopsPage() {
  return (
    <div>
      <PageHeader
        title="SOP library"
        description="Standard operating procedures, division playbooks, and onboarding guides."
      />

      <div className="p-7">
        <Card className="p-10 bg-white text-center">
          <div className="mx-auto max-w-md">
            <h2 className="text-[18px] font-semibold text-[var(--color-fg)]">Connecting soon</h2>
            <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">
              The SOP library will live here. Once the source is connected, every division will
              have its playbooks, checklists, and standard procedures in one place.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
