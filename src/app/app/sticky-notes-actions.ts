'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';
import type { StickyNote } from '@/lib/supabase/types';

const NOTE_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange'] as const;

const UpdateSchema = z.object({
  body: z.string().max(500).optional(),
  color: z.enum(NOTE_COLORS).optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  w: z.number().min(120).max(420).optional(),
  h: z.number().min(110).max(420).optional(),
  rotation: z.number().min(-30).max(30).optional(),
  z_index: z.number().int().min(0).optional(),
});

export async function createStickyNote() {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const { data: topRow } = await supabase
    .from('sticky_notes')
    .select('z_index')
    .eq('user_id', profile.id)
    .order('z_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextZ = ((topRow as { z_index: number } | null)?.z_index ?? 0) + 1;

  // Scatter new notes a little so they don't stack perfectly.
  const x = 6 + Math.round(Math.random() * 30);
  const y = 6 + Math.round(Math.random() * 25);
  const rotation = Math.round((Math.random() * 8 - 4) * 10) / 10;

  const { data, error } = await supabase
    .from('sticky_notes')
    .insert({
      user_id: profile.id,
      body: '',
      color: NOTE_COLORS[nextZ % NOTE_COLORS.length],
      x,
      y,
      rotation,
      z_index: nextZ,
    })
    .select('*')
    .single();
  if (error) return { error: error.message };

  return { ok: true, note: data as StickyNote };
}

export async function updateStickyNote(
  id: string,
  patch: z.infer<typeof UpdateSchema>,
) {
  const { profile } = await requireCurrentUser();
  const parsed = UpdateSchema.safeParse(patch);
  if (!parsed.success) return { error: 'Invalid note update.' };
  if (Object.keys(parsed.data).length === 0) return { ok: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from('sticky_notes')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', profile.id);
  if (error) return { error: error.message };

  return { ok: true };
}

export async function deleteStickyNote(id: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from('sticky_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', profile.id);
  if (error) return { error: error.message };

  return { ok: true };
}
