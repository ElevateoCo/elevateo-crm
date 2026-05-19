'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DeleteEntityButton({
  entityLabel,
  entityName,
  action,
  cascadeNote,
}: {
  entityLabel: string;
  entityName: string;
  action: () => Promise<{ error?: string } | void>;
  cascadeNote?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res && 'error' in res && res.error) {
        setError(res.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this {entityLabel}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-[13px] text-[var(--color-fg-muted)]">
            <p>
              <strong className="text-[var(--color-fg)]">{entityName}</strong> will be
              permanently removed.
            </p>
            {cascadeNote ? <p>{cascadeNote}</p> : null}
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-[12px] px-3 py-2">
                {error}
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
              disabled={pending}
            >
              {pending ? 'Deleting...' : `Delete ${entityLabel}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
