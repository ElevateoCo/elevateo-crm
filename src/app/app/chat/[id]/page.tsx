import { notFound } from 'next/navigation';
import { Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { UserPill } from '@/components/shared/user-pill';
import { Composer } from '../composer';
import { MessageList } from '../message-list';

export const dynamic = 'force-dynamic';

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const { data: room } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!room) notFound();

  const [users, divisions, { data: messages }] = await Promise.all([
    getAllUsers(),
    getDivisions(),
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(200),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  let title: React.ReactNode = 'Room';
  if (room.kind === 'division') {
    const div = divisions.find((d) => d.id === room.division_id);
    title = (
      <span className="inline-flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5" />
        {div?.name ?? 'Division'}
      </span>
    );
  } else if (room.kind === 'dm') {
    const otherId = room.user_a_id === profile.id ? room.user_b_id : room.user_a_id;
    const other = otherId ? userMap.get(otherId) : null;
    title = <UserPill user={other ?? null} size="sm" />;
  }

  const msgs = (messages ?? []) as Array<{
    id: string;
    room_id: string;
    author_id: string | null;
    body: string;
    pinned: boolean;
    created_at: string;
  }>;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-fg)]">
        {title}
      </div>

      <MessageList messages={msgs} currentUserId={profile.id} users={users} />

      <Composer roomId={id} users={users} />
    </div>
  );
}
