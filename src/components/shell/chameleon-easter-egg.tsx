'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Elevateo signature easter egg.
 *
 * A tiny ~10px sliver of /texture.png in the corner. Looks like a UI artifact —
 * by design, nobody should notice it on a normal pass. If you misclick it
 * (or hunt for it), the chameleon photo slides out and a "You caught me!"
 * tooltip pops above. Click again to collapse.
 *
 * Hidden on /app/admin/* per the design guide.
 */
const IMAGE_SIZE = 22;
const SLIVER_WIDTH = 10;
const REVEAL_WIDTH = 96;

export function ChameleonEasterEgg() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);

  if (pathname?.startsWith('/app/admin')) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setActive((v) => !v);
      }}
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 40,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      aria-label="Easter egg"
    >
      {/* Tooltip floats above when active */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          right: 0,
          background: '#1f3358',
          color: '#faf6ea',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: 1,
          padding: '6px 12px',
          borderRadius: 999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          whiteSpace: 'nowrap',
          opacity: active ? 1 : 0,
          transform: active ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity .3s ease, transform .3s ease',
          pointerEvents: 'none',
        }}
      >
        You caught me!
      </div>

      {/* Image strip — only the left N pixels show by default. */}
      <div
        style={{
          position: 'relative',
          width: REVEAL_WIDTH,
          height: IMAGE_SIZE,
          borderRadius: 4,
          overflow: 'hidden',
          transition: 'clip-path .55s cubic-bezier(.3, 1, .3, 1), opacity .3s ease',
          opacity: active ? 1 : 0.55,
          clipPath: active
            ? 'inset(0 0 0 0 round 4px)'
            : `inset(0 ${REVEAL_WIDTH - SLIVER_WIDTH}px 0 0 round 4px)`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/texture.png"
          alt=""
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: IMAGE_SIZE,
            width: REVEAL_WIDTH,
            objectFit: 'cover',
            objectPosition: 'left center',
          }}
        />
      </div>
    </div>
  );
}
