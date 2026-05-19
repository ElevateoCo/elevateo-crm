'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const MessageSchema = z.object({
  room_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function sendMessage(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = MessageSchema.safeParse({
    room_id: formData.get('room_id'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase.from('chat_messages').insert({
    room_id: parsed.data.room_id,
    author_id: profile.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  revalidatePath(`/app/chat/${parsed.data.room_id}`);
  return { ok: true };
}

export async function togglePin(messageId: string, nextPinned: boolean) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('room_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!msg) return { error: 'Message not found' };

  const { error } = await supabase
    .from('chat_messages')
    .update({ pinned: nextPinned })
    .eq('id', messageId);
  if (error) return { error: error.message };

  revalidatePath(`/app/chat/${msg.room_id}`);
  return { ok: true };
}

export async function deleteMessage(messageId: string) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('room_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!msg) return { error: 'Message not found' };

  const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
  if (error) return { error: error.message };

  revalidatePath(`/app/chat/${msg.room_id}`);
  return { ok: true };
}

export async function startDM(otherUserId: string) {
  await requireCurrentUser();
  const parsed = z.string().uuid().safeParse(otherUserId);
  if (!parsed.success) return { error: 'Invalid user' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_or_create_dm', { p_other: parsed.data });
  if (error) return { error: error.message };

  revalidatePath('/app/chat');
  redirect(`/app/chat/${data as string}`);
}
