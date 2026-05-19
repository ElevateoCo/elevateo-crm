import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/app');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold text-[15px] tracking-tight">Elevateoco</span>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-5 text-[var(--color-fg)]">
            Run the company,
            <br />
            <span className="text-[var(--color-fg-muted)]">beautifully.</span>
          </h1>
          <p className="text-[var(--color-fg-muted)] mb-9 text-lg max-w-xl mx-auto leading-relaxed">
            Hierarchical task flow, division ownership, approval queues — one calm
            source of truth for everything Elevateoco ships.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="px-6 py-4 text-[12px] text-[var(--color-fg-dim)] text-center">
        © Elevateoco
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[#5ac8fa] flex items-center justify-center text-white font-semibold text-sm shadow-[0_2px_6px_rgba(0,113,227,0.25)]">
      E
    </div>
  );
}
