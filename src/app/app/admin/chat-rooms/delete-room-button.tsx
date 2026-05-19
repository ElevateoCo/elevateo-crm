'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminDeleteRoom } from './actions';

export function DeleteRoomButton({ roomId, label }: { roomId: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const r = await adminDeleteRoom(roomId);
      if (r?.error) toast.error(r.error);
      else {
        toast.success('Room deleted');
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this DM?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            <strong className="text-[var(--color-fg)]">{label}</strong>
            <br />
            All messages, pinned items, and read state in this thread will be permanently
            removed. You don't see message contents here — this is a blind moderation
            tool.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={onConfirm}
            >
              {pending ? 'Deleting...' : 'Delete DM'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
