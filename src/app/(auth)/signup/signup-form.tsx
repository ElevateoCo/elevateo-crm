'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp, type AuthState } from '../login/actions';

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" placeholder="Hazem Dweik" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@elevateoco.com"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          minLength={6}
          required
        />
      </div>
      {state?.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] px-3 py-2">
          {state.error}
        </div>
      ) : null}
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
