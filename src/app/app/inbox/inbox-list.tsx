'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { relativeTime, formatDate } from '@/lib/utils';
import { markRead } from './actions';
import type { Notification, User } from '@/lib/supabase/types';

const labelByType: Record<string, string> = {
  task_assigned: 'Task assigned',
  task_mentioned: 'Mention',
  task_review_requested: 'Review requested',
  task_approved: 'Approved',
  task_rejected: 'Rejected',
  comment_reply: 'Reply',
  project_assigned: 'Project',
  approval_pending: 'Approval pending',
  announcement: 'Announcement',
  chat_mention: 'Chat mention',
};

export function InboxList({
  notifications,
  users,
}: {
  notifications: Notification[];
  users: User[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const userMap = new Map(users.map((u) => [u.id, u]));

  function onToggle(n: Notification) {
    const next = openId === n.id ? null : n.id;
    setOpenId(next);
    if (next === n.id && !n.read_at) {
      start(async () => {
        await markRead(n.id);
      });
    }
  }

  return (
    <>
      {notifications.map((n) => {
        const actor = n.actor_id ? userMap.get(n.actor_id) : null;
        const unread = !n.read_at;
        const open = openId === n.id;
        return (
          <div
            key={n.id}
            className={`border-b border-[var(--color-border)] last:border-b-0 ${
              unread ? 'bg-[var(--color-surface-2)]/40' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => onToggle(n)}
              className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-surface-2)] transition"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                  unread ? 'bg-[var(--color-accent)]' : 'bg-transparent'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge tone="default">{labelByType[n.type] ?? n.type}</Badge>
                  <span
                    className={`text-sm font-medium ${
                      open ? '' : 'truncate'
                    } text-[var(--color-fg)]`}
                  >
                    {n.title}
                  </span>
                </div>
                {n.body ? (
                  <div
                    className={`text-xs text-[var(--color-fg-muted)] ${
                      open ? 'whitespace-pre-wrap' : 'truncate'
                    }`}
                  >
                    {n.body}
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-[10px] text-[var(--color-fg-dim)] mt-1">
                  {actor ? <UserPill user={actor} size="xs" /> : null}
                  <span>· {relativeTime(n.created_at)}</span>
                  {open ? (
                    <span>
                      · {formatDate(n.created_at, {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
            {open && n.link ? (
              <div className="px-4 pb-3 pl-9 flex items-center gap-3 text-[12px]">
                <Link
                  href={n.link}
                  className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
                >
                  Open source <ArrowUpRight className="h-3 w-3" />
                </Link>
                {pending && unread ? (
                  <span className="text-[var(--color-fg-dim)]">marking read...</span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
