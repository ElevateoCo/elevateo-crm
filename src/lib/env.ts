// Local-mode app: storage lives on disk in .data/elevateoco.json.
// SUPABASE_CONFIGURED stays true so guards in pages always pass through.
export const env = {
  SUPABASE_URL: 'local',
  SUPABASE_ANON_KEY: 'local',
  SUPABASE_CONFIGURED: true,
};

export function assertSupabaseEnv() {
  // No-op in local mode. When swapping to real Supabase, enforce env again here.
}
