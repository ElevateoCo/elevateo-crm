import Link from 'next/link';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] to-[#5ac8fa] flex items-center justify-center text-white font-semibold text-sm shadow-[0_2px_6px_rgba(0,113,227,0.25)]">
          E
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none tracking-tight">Elevateoco</div>
          <div className="text-[12px] text-[var(--color-fg-muted)] mt-1">Create your account</div>
        </div>
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight mb-1.5">Join Elevateoco</h1>
      <p className="text-[13px] text-[var(--color-fg-muted)] mb-6">
        An admin will assign your division and manager after signup.
      </p>
      <SignupForm />
      <div className="text-[12px] text-[var(--color-fg-muted)] mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
