import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { UserPill } from '@/components/shared/user-pill';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import { DeleteRoomButton } from './delete-room-button';
import type { User } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function ChatRoomsAdminPage() {
  const supabase = await createClient();
  const [{ data: rooms }, users] = await Promise.all([
    supabase.rpc('admin_list_dm_rooms'),
    getAllUsers(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const list = ((rooms ?? []) as Array<{
    id: string;
    user_a_id: string;
    user_b_id: string;
    created_at: string;
    message_count: number;
    last_message_at: string | null;
  }>);

  return (
    <div>
      <PageHeader
        title="Direct messages"
        description="Every DM in the workspace. You can't read the messages — RLS keeps them private — but you can purge a thread when needed."
      />

      <div className="p-6">
        <Card>
          <div className="grid grid-cols-[1fr_1fr_120px_180px_80px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
            <div>Participant A</div>
            <div>Participant B</div>
            <div>Messages</div>
            <div>Last activity</div>
            <div className="text-right">Delete</div>
          </div>
          {list.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
              No DM rooms yet.
            </div>
          ) : (
            list.map((r) => {
              const a = userMap.get(r.user_a_id);
              const b = userMap.get(r.user_b_id);
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_1fr_120px_180px_80px] items-center px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0"
                >
                  <UserPill user={a ?? null} />
                  <UserPill user={b ?? null} />
                  <div className="text-[12px] text-[var(--color-fg-muted)] tabular-nums">
                    {r.message_count}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-muted)]">
                    {r.last_message_at ? relativeTime(r.last_message_at) : '—'}
                  </div>
                  <div className="text-right">
                    <DeleteRoomButton
                      roomId={r.id}
                      label={`DM between ${a?.full_name ?? a?.email ?? '?'} and ${b?.full_name ?? b?.email ?? '?'}`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
