'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';
import type { User } from '@/lib/supabase/types';
import { ProfileCardDialog } from './profile-card';
import { PresenceDot } from './presence-dot';

export function UserPill({
  user,
  size = 'sm',
}: {
  user: User | null | undefined;
  size?: 'xs' | 'sm';
}) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)]">
        <span className="h-5 w-5 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-[9px]">
          ?
        </span>
        Unassigned
      </span>
    );
  }
  const name = user.full_name || user.email;
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded hover:opacity-80 transition cursor-pointer"
        title={`Open ${name}'s profile`}
      >
        <span className="relative inline-flex">
          <Avatar className={size === 'xs' ? 'h-5 w-5' : 'h-6 w-6'}>
            {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={name} /> : null}
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <PresenceDot user={user} size={size === 'xs' ? 8 : 9} />
        </span>
        <span className={size === 'xs' ? 'text-[11px]' : 'text-xs'}>{name}</span>
      </button>
      <ProfileCardDialog user={user} open={open} onOpenChange={setOpen} />
    </>
  );
}
