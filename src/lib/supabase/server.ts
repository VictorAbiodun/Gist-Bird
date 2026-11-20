import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseEnv } from './env';

export function createClient() {
  const store = cookies(); // reading cookies marks the page as dynamic
  const env = supabaseEnv();
  if (!env) throw new Error('Supabase is not configured. See README.');
  return createServerClient(env.url, env.anon, {
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365, // 1 year persistent phone session
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 365,
              sameSite: 'lax',
              path: '/',
              secure: process.env.NODE_ENV === 'production',
            })
          );
        } catch {
          /* called from a Server Component: middleware refreshes the session */
        }
      },
    },
  });
}
