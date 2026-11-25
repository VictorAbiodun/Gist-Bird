import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = (await request.json()) as {
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    };
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    const admin = createAdminClient();
    const existing = Array.isArray(user.user_metadata?.push_subscriptions)
      ? (user.user_metadata.push_subscriptions as Array<{ endpoint?: string }>)
      : [];

    const deduped = [
      subscription,
      ...existing.filter((s) => s?.endpoint && s.endpoint !== subscription.endpoint),
    ].slice(0, 5);

    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        push_subscriptions: deduped,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Push subscribe error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
