import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { ItSettingsClient } from './it-settings-client';

export const dynamic = 'force-dynamic';

export default async function ItSettingsPage() {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const adminDiv = divisions.find((d) => d.code === 'admin');
  const isAdmin = profile.role === 'owner' || profile.division_id === adminDiv?.id;
  if (!isAdmin) redirect('/app');

  const users = await getAllUsers();

  return (
    <div>
      <PageHeader
        title="IT settings"
        description="Add and remove team members, reset passwords, change emails and names."
      />

      <div className="p-6">
        <Card className="p-4">
          <ItSettingsClient
            users={users}
            divisions={divisions}
            currentUserId={profile.id}
          />
        </Card>
      </div>
    </div>
  );
}
