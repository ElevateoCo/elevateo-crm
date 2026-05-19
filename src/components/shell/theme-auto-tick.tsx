'use client';

import { useEffect } from 'react';

/**
 * Re-evaluates auto-time theme every minute. Mounts at the root so it runs
 * everywhere in the authenticated app.
 */
function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function parseTime(s: string | null, fallback: number): number {
  if (!s) return fallback;
  const [h, m] = s.split(':').map((n) => parseInt(n, 10));
  if (isNaN(h)) return fallback;
  return h * 60 + (isNaN(m) ? 0 : m);
}

function evaluate() {
  if (typeof window === 'undefined') return;
  const mode = localStorage.getItem('theme');
  if (mode !== 'auto-time') return;
  const sunrise = parseTime(localStorage.getItem('theme-sunrise'), 6 * 60);
  const sunset = parseTime(localStorage.getItem('theme-sunset'), 19 * 60 + 30);
  const minutes = nowMinutes();
  const dark = minutes >= sunset || minutes < sunrise;
  document.documentElement.classList.toggle('dark', dark);
}

export function ThemeAutoTick() {
  useEffect(() => {
    evaluate();
    const tick = window.setInterval(evaluate, 60_000);
    return () => window.clearInterval(tick);
  }, []);
  return null;
}
