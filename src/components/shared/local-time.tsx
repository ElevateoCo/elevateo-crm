'use client';

import { useEffect, useState } from 'react';

function format(timezone: string | null | undefined): { time: string; zone: string } | null {
  if (!timezone) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    const parts = fmt.formatToParts(new Date());
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '--';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '--';
    const zone = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return { time: `${hour}:${minute}`, zone };
  } catch {
    return null;
  }
}

/**
 * Live, ticking local-time chip for a user.
 * Renders nothing if the user has no timezone set.
 */
export function LocalTime({
  timezone,
  className,
}: {
  timezone: string | null | undefined;
  className?: string;
}) {
  const [val, setVal] = useState<{ time: string; zone: string } | null>(() => format(timezone));

  useEffect(() => {
    setVal(format(timezone));
    if (!timezone) return;
    const tick = window.setInterval(() => setVal(format(timezone)), 30_000);
    return () => window.clearInterval(tick);
  }, [timezone]);

  if (!val) return null;
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-fg-muted)] tabular-nums ' +
        (className ?? '')
      }
      title={timezone ?? undefined}
    >
      {val.time}
      <span className="text-[var(--color-fg-dim)]">{val.zone}</span>
    </span>
  );
}
