'use client';

import { useEffect, useState } from 'react';

/**
 * A one-shot blackout overlay that fades from black to transparent on mount
 * if the `transition-in` sessionStorage flag is set. Used to bridge the
 * welcome → /app and farewell → /login transitions so the destination
 * doesn't pop in abruptly.
 */
export function TransitionFader() {
  const [active, setActive] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    let armed = false;
    try {
      armed = sessionStorage.getItem('transition-in') === '1';
      if (armed) sessionStorage.removeItem('transition-in');
    } catch {}
    if (!armed) return;
    setActive(true);
    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFadingOut(true));
    });
    const remove = window.setTimeout(() => setActive(false), 900);
    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(remove);
    };
  }, []);

  if (!active) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 700ms cubic-bezier(0.4, 0, 0.6, 1)',
        pointerEvents: fadingOut ? 'none' : 'auto',
        zIndex: 100,
      }}
    />
  );
}
