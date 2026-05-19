'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const TitleSchema = z.string().min(1).max(140);

export async function createHabit(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = TitleSchema.safeParse(formData.get('title'));
  if (!parsed.success) return { error: 'Title required' };

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from('habits')
    .select('sort_index')
    .eq('user_id', profile.id)
    .order('sort_index', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextIndex = ((maxRow as { sort_index: number } | null)?.sort_index ?? -1) + 1;

  const { error } = await supabase.from('habits').insert({
    user_id: profile.id,
    title: parsed.data,
    sort_index: nextIndex,
  });
  if (error) return { error: error.message };

  revalidatePath('/app/habits');
  revalidatePath('/app');
  return { ok: true };
}

export async function deleteHabit(habitId: string) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) return { error: error.message };
  revalidatePath('/app/habits');
  revalidatePath('/app');
  return { ok: true };
}

export async function renameHabit(habitId: string, title: string) {
  await requireCurrentUser();
  const parsed = TitleSchema.safeParse(title);
  if (!parsed.success) return { error: 'Title required' };
  const supabase = await createClient();
  const { error } = await supabase.from('habits').update({ title: parsed.data }).eq('id', habitId);
  if (error) return { error: error.message };
  revalidatePath('/app/habits');
  revalidatePath('/app');
  return { ok: true };
}

export async function toggleHabitToday(habitId: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_on', today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('id', (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('habit_completions').insert({
      habit_id: habitId,
      user_id: profile.id,
      completed_on: today,
    });
    if (error) return { error: error.message };
  }

  revalidatePath('/app/habits');
  revalidatePath('/app');
  return { ok: true };
}
