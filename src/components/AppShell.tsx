'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { TabBar } from './TabBar';
import { InstallPrompt } from './InstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';
import { initNavDirectionListener } from '@/lib/navDirection';

const HIDE_BAR = ['/chat/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

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

  useEffect(() => {
    initNavDirectionListener();
  }, []);

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
