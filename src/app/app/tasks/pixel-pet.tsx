'use client';

import { useState } from 'react';

/**
 * The empty-state pixel pet. When you have no tasks, you get a pet. It cannot
 * die. It cannot grow. It is a pixel.
 */
export function PixelPet() {
  const [message, setMessage] = useState<string | null>(null);
  const [bumpId, setBumpId] = useState(0);

  function poke(label: string, line: string) {
    setMessage(line);
    setBumpId((v) => v + 1);
    window.clearTimeout((poke as any)._t);
    (poke as any)._t = window.setTimeout(() => setMessage(null), 2200);
  }

  const offsetX = (bumpId % 5) - 2;
  const offsetY = (Math.floor(bumpId / 5) % 5) - 2;

  return (
    <div className="px-4 py-10 flex flex-col items-center gap-5">
      <div className="text-[13px] uppercase tracking-wider text-[var(--color-fg-dim)]">
        Your pet
      </div>

      <div className="relative w-[260px] h-[200px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] grid place-items-center overflow-hidden">
        <div
          aria-label="A pixel."
          style={{
            width: 1,
            height: 1,
            background: 'var(--color-fg)',
            transform: `translate(${offsetX}px, ${offsetY}px)`,
            transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
        {message ? (
          <div className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-[var(--color-fg-muted)]">
            {message}
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => poke('feed', 'It eats a pixel of bread.')}
          className="px-3.5 py-1.5 text-[12px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-3)] transition"
        >
          Feed
        </button>
        <button
          type="button"
          onClick={() => poke('pet', 'It feels you, possibly.')}
          className="px-3.5 py-1.5 text-[12px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-3)] transition"
        >
          Pet
        </button>
        <button
          type="button"
          onClick={() => poke('play', 'It plays. In its own way.')}
          className="px-3.5 py-1.5 text-[12px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-3)] transition"
        >
          Play
        </button>
      </div>

      <p className="text-center text-[11px] text-[var(--color-fg-dim)] max-w-[280px] leading-relaxed">
        This is your pet. It cannot die. It cannot grow. It is a pixel.
        Empty queue means quiet time. Enjoy it.
      </p>
    </div>
  );
}
