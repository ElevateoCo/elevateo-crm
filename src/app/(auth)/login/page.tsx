import Image from 'next/image';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-9 w-9 overflow-hidden rounded-xl border border-black/10 bg-[#f6f4f0] shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
          <Image
            src="/branding/elevateo-bureau/transparent-icon.png"
            alt=""
            width={36}
            height={36}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none tracking-tight">Elevateo Bureau</div>
          <div className="text-[12px] text-[var(--color-fg-muted)] mt-1">Welcome back</div>
        </div>
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight mb-1.5">Sign in to your account</h1>
      <p className="text-[13px] text-[var(--color-fg-muted)] mb-6">
        Use the email your admin invited you with.
      </p>
      <LoginForm next={next} />
    </div>
  );
}
