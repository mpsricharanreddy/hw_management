import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Never import this in
// client components — the service role key must stay secret.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
