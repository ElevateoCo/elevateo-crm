'use client';

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { taskBoardColumns, taskStatusLabel, priorityTone } from '@/lib/formatters';
import type { Task, User } from '@/lib/supabase/types';
import { formatDate } from '@/lib/utils';

export function TaskBoard({ tasks, users }: { tasks: Task[]; users: User[] }) {
  const userMap = new Map(users.map((u) => [u.id, u]));
  const byStatus = new Map<string, Task[]>();
  for (const status of taskBoardColumns) byStatus.set(status, []);
  for (const t of tasks) {
    const col = taskBoardColumns.includes(t.status as never) ? t.status : 'todo';
    byStatus.get(col)?.push(t);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      {taskBoardColumns.map((status) => {
        const list = byStatus.get(status) ?? [];
        return (
          <div
            key={status}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
              <div className="text-[12px] font-medium text-[var(--color-fg)]">
                {taskStatusLabel[status]}
              </div>
              <span className="text-[11px] font-mono text-[var(--color-fg-dim)]">{list.length}</span>
            </div>
            <div className="flex-1 p-2.5 space-y-2 min-h-[80px]">
              {list.length === 0 ? (
                <div className="text-[12px] text-[var(--color-fg-dim)] px-2 py-3">Nothing here.</div>
              ) : (
                list.map((t) => {
                  const assignee = t.assigned_to ? userMap.get(t.assigned_to) : null;
                  const overdue =
                    t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done';
                  return (
                    <Link
                      key={t.id}
                      href={`/app/tasks/${t.id}`}
                      className="block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-[var(--color-border-strong)] transition"
                    >
                      <div className="text-[13px] font-medium line-clamp-2 mb-2 text-[var(--color-fg)]">
                        {t.title}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Badge tone={priorityTone[t.priority]} className="capitalize">
                            {t.priority}
                          </Badge>
                          {t.deadline ? (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] ${
                                overdue ? 'text-[var(--color-danger)]' : 'text-[var(--color-fg-dim)]'
                              }`}
                            >
                              <CalendarDays className="h-2.5 w-2.5" />
                              {formatDate(t.deadline)}
                            </span>
                          ) : null}
                        </div>
                        <UserPill user={assignee ?? null} size="xs" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
