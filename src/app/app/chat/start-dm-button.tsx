'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPill } from '@/components/shared/user-pill';
import { startDM } from './actions';
import type { User } from '@/lib/supabase/types';

export function StartDmButton({ users }: { users: User[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [pending, startTransition] = useTransition();

  const list = q.trim()
    ? users.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q.toLowerCase()) ||
          u.email.toLowerCase().includes(q.toLowerCase()),
      )
    : users;

  function pick(userId: string) {
    startTransition(async () => {
      const r = await startDM(userId);
      if (r && 'error' in r && r.error) toast.error(r.error);
      else setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"
          title="Start a DM"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a direct message</DialogTitle>
        </DialogHeader>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-fg-dim)]" />
          <Input
            placeholder="Search people..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-0.5">
          {list.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={pending}
              onClick={() => pick(u.id)}
              className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--color-surface-3)]/70 text-left"
            >
              <UserPill user={u} size="xs" />
            </button>
          ))}
          {list.length === 0 ? (
            <p className="text-[12px] text-[var(--color-fg-dim)] px-2 py-3">No matches.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
