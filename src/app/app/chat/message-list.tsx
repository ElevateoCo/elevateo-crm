'use client';

import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pin, PinOff, Trash2 } from 'lucide-react';
import { UserPill } from '@/components/shared/user-pill';
import { relativeTime } from '@/lib/utils';
import { togglePin, deleteMessage } from './actions';
import type { User } from '@/lib/supabase/types';

type Message = {
  id: string;
  room_id: string;
  author_id: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
};

const REFRESH_MS = 5000;

export function MessageList({
  messages,
  currentUserId,
  users,
}: {
  messages: Message[];
  currentUserId: string;
  users: User[];
}) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [pending, start] = useTransition();
  const userMap = new Map(users.map((u) => [u.id, u]));
  const pinned = messages.filter((m) => m.pinned);
  const flow = messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(t);
  }, [router]);

  function onPin(id: string, next: boolean) {
    start(async () => {
      const r = await togglePin(id, next);
      if (r?.error) toast.error(r.error);
    });
  }

  function onDelete(id: string) {
    start(async () => {
      const r = await deleteMessage(id);
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
      {pinned.length > 0 ? (
        <div className="rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-2 space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] flex items-center gap-1">
            <Pin className="h-3 w-3" /> Pinned
          </div>
          {pinned.map((m) => (
            <div key={'p' + m.id} className="text-[12px] text-[var(--color-fg-muted)]">
              <span className="font-medium text-[var(--color-fg)]">
                {(m.author_id && userMap.get(m.author_id)?.full_name) || 'Unknown'}:
              </span>{' '}
              {m.body}
            </div>
          ))}
        </div>
      ) : null}

      {flow.length === 0 ? (
        <div className="text-center text-[12px] text-[var(--color-fg-dim)] py-10">
          No messages yet. Say hi.
        </div>
      ) : (
        flow.map((m) => {
          const author = m.author_id ? userMap.get(m.author_id) : null;
          const own = m.author_id === currentUserId;
          return (
            <div key={m.id} className="group flex items-start gap-2.5">
              <UserPill user={author ?? null} size="xs" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] text-[var(--color-fg-dim)]">
                    {relativeTime(m.created_at)}
                  </span>
                  {m.pinned ? (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-warning)] flex items-center gap-0.5">
                      <Pin className="h-2.5 w-2.5" /> pinned
                    </span>
                  ) : null}
                </div>
                <div className="text-[13px] text-[var(--color-fg)] whitespace-pre-wrap break-words">
                  {m.body}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onPin(m.id, !m.pinned)}
                  className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"
                  title={m.pinned ? 'Unpin' : 'Pin'}
                >
                  {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                {own ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onDelete(m.id)}
                    className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-[var(--color-fg-muted)]"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
