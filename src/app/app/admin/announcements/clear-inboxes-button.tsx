'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Inbox, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clearAllAnnouncementNotifications } from './actions';

export function ClearInboxesButton() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onConfirm() {
    start(async () => {
      const r = await clearAllAnnouncementNotifications();
      if (r?.error) toast.error(r.error);
      else {
        toast.success(`Cleared ${r.count ?? 0} announcement notifications`);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-700"
      >
        <Inbox className="h-3.5 w-3.5" />
        Clear from inboxes
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear announcement notifications?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-[var(--color-fg-muted)]">
            Removes every announcement notification from every user's inbox. The announcements
            source above is untouched, and chat/task notifications are not affected. Useful
            after a test post.
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
              <Trash2 className="h-3.5 w-3.5" />
              {pending ? 'Clearing...' : 'Clear from inboxes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
