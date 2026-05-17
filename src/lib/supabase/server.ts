import { createLocalClient } from '@/lib/local/client';

// Local-mode placeholder. When you move to real Supabase, swap this back to
// createServerClient from @supabase/ssr and feed it env URLs + cookies.
export async function createClient() {
  return createLocalClient();
}
