'use client';

import { useEffect, useRef } from 'react';

const SEEN_KEY = 'chat-last-unread-seen';
const ENABLED_KEY = 'notify-sound-enabled';
const SOUND_URL = '/sounds/sound-1.mp3';

/**
 * Plays a chime when the total chat unread count goes up between renders.
 * Uses sessionStorage so the baseline survives navigation but not full reloads.
 * Mounted once at the app shell.
 */
export function ChatChime({ unread }: { unread: number }) {
  const armed = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SEEN_KEY, String(unread));
    armed.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!armed.current) return;
    const lastSeen = Number(sessionStorage.getItem(SEEN_KEY) ?? '0');
    const enabled = localStorage.getItem(ENABLED_KEY) !== 'false';
    if (enabled && unread > lastSeen) {
      const el = new Audio(SOUND_URL);
      el.volume = 0.3;
      el.play().catch(() => {});
    }
    sessionStorage.setItem(SEEN_KEY, String(unread));
  }, [unread]);

  return null;
}
