'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendMessage } from './actions';

export function Composer({ roomId }: { roomId: string }) {
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set('room_id', roomId);
    fd.set('body', trimmed);
    startTransition(async () => {
      const r = await sendMessage(fd);
      if (r?.error) toast.error(r.error);
      else setBody('');
    });
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex items-end gap-2">
      <Textarea
        rows={2}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Type a message... (Enter to send, Shift+Enter for a new line)"
        className="resize-none flex-1"
      />
      <Button onClick={submit} disabled={pending || !body.trim()}>
        <Send className="h-3.5 w-3.5" />
        {pending ? 'Sending' : 'Send'}
      </Button>
    </div>
  );
}
