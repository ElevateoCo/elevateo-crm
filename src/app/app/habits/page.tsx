import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';
import { HabitsManager } from './habits-manager';
import type { Habit, HabitCompletion } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function HabitsPage() {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('sort_index'),
    supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('completed_on', today),
  ]);

  const doneToday = new Set(
    ((completions ?? []) as HabitCompletion[]).map((c) => c.habit_id),
  );

  return (
    <div>
      <PageHeader
        title="Daily habits"
        description="Reset every midnight. Doesn't stack. If you don't finish a habit today, it just rolls forward fresh tomorrow."
      />
      <div className="p-6">
        <Card>
          <CardContent>
            <HabitsManager
              habits={(habits ?? []) as Habit[]}
              doneToday={Array.from(doneToday)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
