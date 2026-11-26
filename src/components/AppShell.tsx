'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { touchLastSeen } from '@/app/actions/presence';
import { TabBar } from './TabBar';
import { InstallPrompt } from './InstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';
import { initNavDirectionListener } from '@/lib/navDirection';

const HIDE_BAR = ['/chat/', '/feed/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

export function AppShell({
  inbox = 0,
  chats = 0,
  userId,
  children,
}: {
  inbox?: number;
  chats?: number;
  userId?: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const hide = HIDE_BAR.some((h) => path.startsWith(h));
  const lastTouchRef = useRef(0);

  useEffect(() => {
    initNavDirectionListener();
  }, []);

  // Broadcast live presence & persist accurate last_seen_at
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const pingLastSeen = (force = false) => {
      const now = Date.now();
      if (!force && now - lastTouchRef.current < 45_000) return;
      lastTouchRef.current = now;
      touchLastSeen().catch(() => {});
    };

    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    presenceChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && document.visibilityState === 'visible') {
        presenceChannel.track({ userId, onlineAt: new Date().toISOString() }).catch(() => {});
        pingLastSeen(true);
      }
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        presenceChannel.track({ userId, onlineAt: new Date().toISOString() }).catch(() => {});
        pingLastSeen(false);
      } else {
        presenceChannel.untrack().catch(() => {});
        pingLastSeen(true);
      }
    };

    const handlePageHide = () => {
      presenceChannel.untrack().catch(() => {});
      pingLastSeen(true);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      presenceChannel.untrack().catch(() => {});
      supabase.removeChannel(presenceChannel);
    };
  }, [userId]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`relative flex flex-1 flex-col w-full ${hide ? 'min-h-dvh' : 'min-h-dvh pb-[88px]'}`}>
        <PushNotificationManager userId={userId} />
        <InstallPrompt />
        {children}
        {!hide && <TabBar inbox={inbox} chats={chats} />}
      </div>
    </MotionConfig>
  );
}
