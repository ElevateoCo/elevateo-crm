'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { markRoomRead } from './actions';

/**
 * Client-side mark-as-read so the chat sidebar badges and the main 'Chat'
 * tab badge actually clear immediately on open. Lives in /app/chat/[id].
 */
export function MarkRoomReadOnMount({ roomId }: { roomId: string }) {
  const router = useRouter();
  useEffect(() => {
    let cancelled = false;
    markRoomRead(roomId).then(() => {
      if (!cancelled) router.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, [roomId, router]);
  return null;
}
