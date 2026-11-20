import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Service-role client. Server only. Used for account deletion. Never import from client code. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  return createClient(url, key, { auth: { persistSession: false } });
}
