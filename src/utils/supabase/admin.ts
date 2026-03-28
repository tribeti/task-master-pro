import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service_role key.
 * This client bypasses RLS and can access auth.users.
 * ⚠️  Use ONLY in server-side code (API routes / server actions).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
