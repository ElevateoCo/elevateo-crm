'use client';

import { useEffect, useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { roleLabel } from '@/lib/formatters';
import type { User } from '@/lib/supabase/types';

function liveTime(timezone: string | null | undefined): string | null {
  if (!timezone) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    const parts = fmt.formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value ?? '--';
    const m = parts.find((p) => p.type === 'minute')?.value ?? '--';
    const z = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return `${h}:${m} ${z}`.trim();
  } catch {
    return null;
  }
}

export function ProfileCardDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [time, setTime] = useState<string | null>(() => liveTime(user.timezone));

  useEffect(() => {
    if (!open) return;
    setTime(liveTime(user.timezone));
    const tick = window.setInterval(() => setTime(liveTime(user.timezone)), 30_000);
    return () => window.clearInterval(tick);
  }, [open, user.timezone]);

  const name = user.full_name || user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">{name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={name} /> : null}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-[var(--color-fg)] truncate">
              {name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="default">{roleLabel[user.role]}</Badge>
              {user.is_active ? null : <Badge tone="default">Inactive</Badge>}
            </div>
            {user.bio ? (
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">{user.bio}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-[12.5px] text-[var(--color-fg-muted)]">
          <a
            href={`mailto:${user.email}`}
            className="flex items-center gap-2 hover:text-[var(--color-fg)]"
          >
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </a>
          {user.timezone ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {user.timezone}
            </div>
          ) : null}
          {time ? (
            <div className="flex items-center gap-2 tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              Local time {time}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
