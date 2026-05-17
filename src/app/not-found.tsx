import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-[12px] font-medium text-[var(--color-accent)] mb-2">404</div>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Nothing here.</h1>
        <p className="text-[13px] text-[var(--color-fg-muted)] mb-6">
          This page doesn&apos;t exist, or you don&apos;t have access.
        </p>
        <Button asChild>
          <Link href="/app">Back to command center</Link>
        </Button>
      </div>
    </div>
  );
}
