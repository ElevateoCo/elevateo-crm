const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const placeholderValues = new Set([
  '',
  'https://your-project-ref.supabase.co',
  'replace-me-with-publishable-or-anon-key',
]);

export const env = {
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_CONFIGURED:
    !placeholderValues.has(url) &&
    !placeholderValues.has(anonKey),
};

export function assertSupabaseEnv() {
  if (env.SUPABASE_CONFIGURED) return;
  throw new Error(
    'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}
