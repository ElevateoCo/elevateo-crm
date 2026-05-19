'use client';

import { useEffect, useRef, useState } from 'react';

const STAGE_W = 600;
const STAGE_H = 360;

/**
 * The Pixel Game. Arrow keys move a 2px square around a black stage.
 * There is no goal. Shown when the inbox is empty.
 */
export function PixelGame() {
  const [pos, setPos] = useState({ x: STAGE_W / 2, y: STAGE_H / 2 });
  const focusRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!focused) return;
      const step = e.shiftKey ? 8 : 2;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else return;
      e.preventDefault();
      setPos((p) => ({
        x: Math.max(0, Math.min(STAGE_W - 2, p.x + dx)),
        y: Math.max(0, Math.min(STAGE_H - 2, p.y + dy)),
      }));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focused]);

  return (
    <div className="px-4 py-12 flex flex-col items-center gap-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-dim)]">
        Inbox zero
      </div>
      <h2 className="text-[14px] text-[var(--color-fg-muted)] font-mono">The Pixel Game</h2>
      <div
        ref={focusRef}
        tabIndex={0}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="relative rounded-md outline-none"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          background: '#0a0a0c',
          border: `1px solid ${focused ? '#3a3a40' : '#222'}`,
          maxWidth: '100%',
          cursor: 'crosshair',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: 2,
            height: 2,
            background: '#ffffff',
          }}
        />
      </div>
      <small className="text-[11px] font-mono text-[var(--color-fg-dim)]">
        click the stage, then arrow keys to move. shift + arrow goes faster. there is no goal.
      </small>
    </div>
  );
}
