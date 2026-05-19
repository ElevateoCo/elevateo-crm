import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { ChangePasswordForm } from './change-password-form';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/login?next=/change-password');

  return (
    <Card className="w-full p-7 bg-white">
      <h1 className="text-[20px] font-semibold tracking-tight text-[var(--color-fg)]">
        Set a new password
      </h1>
      <p className="mt-1.5 text-[13px] text-[var(--color-fg-muted)]">
        You're signed in with a placeholder password. Choose a new one to continue.
      </p>
      <div className="mt-5">
        <ChangePasswordForm />
      </div>
    </Card>
  );
}
