'use client';

import { usePathname } from 'next/navigation';
import { TabBar } from './TabBar';
import { InstallPrompt } from './InstallPrompt';
import { PushNotificationManager } from './PushNotificationManager';

const HIDE_BAR = ['/chat/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

export function AppShell({
  inbox = 0,
  userId,
  children,
}: {
  inbox?: number;
  userId?: string;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const hide = HIDE_BAR.some((h) => path.startsWith(h));

  return (
    <div className={`relative flex flex-1 flex-col w-full ${hide ? 'min-h-dvh' : 'min-h-dvh pb-[88px]'}`}>
      <PushNotificationManager userId={userId} />
      <InstallPrompt />
      {children}
      {!hide && <TabBar inbox={inbox} />}
    </div>
  );
}
