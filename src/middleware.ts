import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseEnv } from '@/lib/supabase/env';

const PUBLIC = ['/welcome', '/email', '/verify', '/setup', '/offline'];

export async function middleware(req: NextRequest) {
  const env = supabaseEnv();
  const path = req.nextUrl.pathname;
  if (!env) return path === '/setup' ? NextResponse.next() : NextResponse.redirect(new URL('/setup', req.url));

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(env.url, env.anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  let user = null;
  try { user = (await supabase.auth.getUser()).data.user; } catch { /* Supabase unreachable: treat as signed out so public pages still load */ }
  const isPublic = PUBLIC.some((p) => path === p || path.startsWith(p + '/'));

  if (!user && !isPublic && path !== '/') return NextResponse.redirect(new URL('/welcome', req.url));
  if (user && (path === '/welcome' || path === '/email' || path === '/')) return NextResponse.redirect(new URL('/home', req.url));
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|mascot|images|icons|manifest.webmanifest|sw.js).*)'] };
