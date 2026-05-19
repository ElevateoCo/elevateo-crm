'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Plus, Check, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createHabit, deleteHabit, renameHabit, toggleHabitToday } from './actions';
import type { Habit } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function HabitsManager({
  habits,
  doneToday,
}: {
  habits: Habit[];
  doneToday: string[];
}) {
  const [title, setTitle] = useState('');
  const [pending, start] = useTransition();
  const doneSet = new Set(doneToday);

  function add() {
    if (!title.trim()) return;
    const fd = new FormData();
    fd.set('title', title.trim());
    start(async () => {
      const r = await createHabit(fd);
      if (r?.error) toast.error(r.error);
      else setTitle('');
    });
  }

  function toggle(id: string) {
    start(async () => {
      const r = await toggleHabitToday(id);
      if (r?.error) toast.error(r.error);
    });
  }

  function remove(id: string) {
    start(async () => {
      const r = await deleteHabit(id);
      if (r?.error) toast.error(r.error);
      else toast.success('Habit removed');
    });
  }

  function rename(id: string, current: string) {
    const next = window.prompt('Rename habit', current);
    if (!next || next.trim() === current) return;
    start(async () => {
      const r = await renameHabit(id, next.trim());
      if (r?.error) toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a daily habit, e.g. Post 3 videos"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} disabled={pending || !title.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-10 text-[12px] text-[var(--color-fg-dim)]">
          No habits yet. Add one above.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {habits.map((h) => {
            const done = doneSet.has(h.id);
            return (
              <li
                key={h.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 transition',
                  done && 'opacity-60',
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(h.id)}
                  disabled={pending}
                  className={cn(
                    'h-5 w-5 rounded-full border flex items-center justify-center transition',
                    done
                      ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                      : 'border-[var(--color-border-strong)] hover:border-[var(--color-accent)]',
                  )}
                  aria-label={done ? 'Mark not done' : 'Mark done'}
                >
                  {done ? <Check className="h-3 w-3" /> : null}
                </button>
                <span
                  className={cn(
                    'flex-1 text-[14px]',
                    done && 'line-through text-[var(--color-fg-muted)]',
                  )}
                >
                  {h.title}
                </span>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"
                  onClick={() => rename(h.id, h.title)}
                  title="Rename"
                  disabled={pending}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-red-50 hover:text-red-600 text-[var(--color-fg-muted)]"
                  onClick={() => remove(h.id)}
                  title="Delete"
                  disabled={pending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
