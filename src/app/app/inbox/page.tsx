import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { markAllRead } from './actions';
import { getAllUsers, getNotifications, requireCurrentUser } from '@/lib/queries';
import { PixelGame } from './pixel-game';
import { InboxList } from './inbox-list';

export default async function InboxPage() {
  const { profile } = await requireCurrentUser();
  const [notifications, users] = await Promise.all([
    getNotifications(profile.id, 100),
    getAllUsers(),
  ]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Mentions, assignments, approvals, and project moves land here. Click a row to read the full thing."
        actions={
          <form action={markAllRead}>
            <Button variant="secondary" size="sm">
              Mark all read
            </Button>
          </form>
        }
      />

      <div className="p-6">
        <Card>
          {notifications.length === 0 ? (
            <PixelGame />
          ) : (
            <InboxList notifications={notifications} users={users} />
          )}
        </Card>
      </div>
    </div>
  );
}
