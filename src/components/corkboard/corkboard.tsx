'use client';

import { useCallback, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createStickyNote,
  deleteStickyNote,
  updateStickyNote,
} from '@/app/app/sticky-notes-actions';
import type { StickyNote } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const COLORS: Record<string, { bg: string; shadow: string }> = {
  yellow: { bg: '#fdf3a7', shadow: 'rgba(202,178,40,0.45)' },
  pink: { bg: '#fcc7df', shadow: 'rgba(214,109,158,0.45)' },
  blue: { bg: '#bcdcff', shadow: 'rgba(86,140,205,0.45)' },
  green: { bg: '#c2f0c2', shadow: 'rgba(86,170,86,0.45)' },
  orange: { bg: '#ffd6a8', shadow: 'rgba(214,140,60,0.45)' },
};
const COLOR_KEYS = Object.keys(COLORS);

// Keep notes inside the cork, off the wooden frame.
const CLAMP = { minX: 0, maxX: 86, minY: 0, maxY: 78 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function Corkboard({ initialNotes }: { initialNotes: StickyNote[] }) {
  const [notes, setNotes] = useState<StickyNote[]>(initialNotes);
  const [adding, setAdding] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const topZ = notes.reduce((max, n) => Math.max(max, n.z_index), 0);

  const patchLocal = useCallback((id: string, patch: Partial<StickyNote>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  async function add() {
    setAdding(true);
    const r = await createStickyNote();
    setAdding(false);
    if (r?.error || !r?.note) {
      toast.error(r?.error ?? 'Could not add note');
      return;
    }
    setNotes((prev) => [...prev, r.note as StickyNote]);
  }

  async function remove(id: string) {
    const prev = notes;
    setNotes((cur) => cur.filter((n) => n.id !== id));
    const r = await deleteStickyNote(id);
    if (r?.error) {
      toast.error(r.error);
      setNotes(prev);
    }
  }

  function cycleColor(note: StickyNote) {
    const next = COLOR_KEYS[(COLOR_KEYS.indexOf(note.color) + 1) % COLOR_KEYS.length];
    patchLocal(note.id, { color: next });
    void updateStickyNote(note.id, { color: next as never });
  }

  function bringToFront(note: StickyNote) {
    if (note.z_index === topZ && topZ !== 0) return;
    const nextZ = topZ + 1;
    patchLocal(note.id, { z_index: nextZ });
    void updateStickyNote(note.id, { z_index: nextZ });
  }

  function onHandleDown(e: React.PointerEvent, note: StickyNote) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    bringToFront(note);
    dragState.current = {
      id: note.id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      startX: note.x,
      startY: note.y,
      moved: false,
    };
  }

  function onHandleMove(e: React.PointerEvent) {
    const drag = dragState.current;
    const layer = layerRef.current;
    if (!drag || !layer) return;
    const rect = layer.getBoundingClientRect();
    const dx = ((e.clientX - drag.pointerX) / rect.width) * 100;
    const dy = ((e.clientY - drag.pointerY) / rect.height) * 100;
    if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) drag.moved = true;
    patchLocal(drag.id, {
      x: clamp(drag.startX + dx, CLAMP.minX, CLAMP.maxX),
      y: clamp(drag.startY + dy, CLAMP.minY, CLAMP.maxY),
    });
  }

  function onHandleUp(e: React.PointerEvent) {
    const drag = dragState.current;
    dragState.current = null;
    if (!drag) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!drag.moved) return;
    const note = notes.find((n) => n.id === drag.id);
    if (!note) return;
    void updateStickyNote(drag.id, {
      x: Math.round(note.x * 10) / 10,
      y: Math.round(note.y * 10) / 10,
    });
  }

  const resizeState = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    startW: number;
    startH: number;
  } | null>(null);

  function onResizeDown(e: React.PointerEvent, note: StickyNote) {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    bringToFront(note);
    resizeState.current = {
      id: note.id,
      pointerX: e.clientX,
      pointerY: e.clientY,
      startW: note.w,
      startH: note.h,
    };
  }

  function onResizeMove(e: React.PointerEvent) {
    const rs = resizeState.current;
    if (!rs) return;
    patchLocal(rs.id, {
      w: clamp(rs.startW + (e.clientX - rs.pointerX), 120, 420),
      h: clamp(rs.startH + (e.clientY - rs.pointerY), 110, 420),
    });
  }

  function onResizeUp(e: React.PointerEvent) {
    const rs = resizeState.current;
    resizeState.current = null;
    if (!rs) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    const note = notes.find((n) => n.id === rs.id);
    if (!note) return;
    void updateStickyNote(rs.id, { w: Math.round(note.w), h: Math.round(note.h) });
  }

  function saveBody(note: StickyNote, body: string) {
    if (body === note.body) return;
    patchLocal(note.id, { body });
    void updateStickyNote(note.id, { body });
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
      style={{
        backgroundImage: 'url(/corkboard-wood-bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div>
          <h2 className="text-[15px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            Pinboard
          </h2>
          <p className="text-[11px] text-white/70 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
            Your private notes. Drag to move, click a note to edit.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={adding}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[12px] font-medium text-[#3b2a23] shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add note
        </button>
      </div>

      <div className="px-4 pb-5 pt-1">
        <div
          className="relative mx-auto w-full max-w-[920px]"
          style={{ aspectRatio: '608 / 401' }}
        >
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage: 'url(/corkboard.png)',
              backgroundSize: '100% 100%',
            }}
          />
          {/* Notes layer, inset to keep notes on the cork and off the frame. */}
          <div ref={layerRef} className="absolute inset-[6%]">
            {notes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="rounded-md bg-black/15 px-3 py-1.5 text-[12px] text-white/90">
                  No notes yet. Use &ldquo;Add note&rdquo; to pin one.
                </p>
              </div>
            ) : null}
            {notes.map((note) => {
              const color = COLORS[note.color] ?? COLORS.yellow;
              return (
                <div
                  key={note.id}
                  className="group absolute select-none"
                  style={{
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    width: `${note.w}px`,
                    zIndex: note.z_index + 1,
                    transform: `rotate(${note.rotation}deg)`,
                  }}
                  onPointerDown={() => bringToFront(note)}
                >
                  <div
                    className="relative flex flex-col rounded-[2px] p-2.5 pt-4"
                    style={{
                      background: color.bg,
                      height: `${note.h}px`,
                      boxShadow: `0 6px 14px ${color.shadow}, 0 1px 2px rgba(0,0,0,0.2)`,
                    }}
                  >
                    {/* Drag handle / pushpin */}
                    <div
                      onPointerDown={(e) => onHandleDown(e, note)}
                      onPointerMove={onHandleMove}
                      onPointerUp={onHandleUp}
                      className="absolute -top-2 left-1/2 h-5 w-5 -translate-x-1/2 cursor-grab rounded-full active:cursor-grabbing"
                      style={{
                        background:
                          'radial-gradient(circle at 35% 30%, #ff8a8a, #d12f2f 60%, #9e1f1f)',
                        boxShadow: '0 2px 3px rgba(0,0,0,0.4)',
                      }}
                      title="Drag to move"
                    />
                    <button
                      type="button"
                      onClick={() => remove(note.id)}
                      className="absolute right-1 top-1 rounded p-0.5 text-black/35 opacity-0 transition hover:text-black/70 group-hover:opacity-100"
                      title="Delete note"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <textarea
                      defaultValue={note.body}
                      onBlur={(e) => saveBody(note, e.target.value)}
                      placeholder="Write something..."
                      className="w-full flex-1 resize-none bg-transparent text-[12.5px] leading-snug text-[#3a2f1c] placeholder:text-black/30 focus:outline-none"
                      style={{ fontFamily: 'var(--font-handwriting, inherit)' }}
                    />
                    <button
                      type="button"
                      onClick={() => cycleColor(note)}
                      className="mt-1 h-3 w-3 self-start rounded-full border border-black/20 opacity-0 transition group-hover:opacity-100"
                      style={{ background: color.bg }}
                      title="Change colour"
                    />
                    {/* Resize handle */}
                    <div
                      onPointerDown={(e) => onResizeDown(e, note)}
                      onPointerMove={onResizeMove}
                      onPointerUp={onResizeUp}
                      className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize opacity-0 transition group-hover:opacity-100"
                      title="Drag to resize"
                      style={{
                        background:
                          'linear-gradient(135deg, transparent 0 50%, rgba(0,0,0,0.28) 50% 60%, transparent 60% 70%, rgba(0,0,0,0.28) 70% 80%, transparent 80%)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
