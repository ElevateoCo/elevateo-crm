'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

export async function adminDeleteRoom(roomId: string) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_delete_room', { p_room_id: roomId });
  if (error) return { error: error.message };
  revalidatePath('/app/admin/chat-rooms');
  revalidatePath('/app/chat');
  return { ok: true };
}
