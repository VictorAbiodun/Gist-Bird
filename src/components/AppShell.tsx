'use client';

import { usePathname } from 'next/navigation';
import { TabBar } from './TabBar';

const HIDE_BAR = ['/chat/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

export function AppShell({ inbox = 0, children }: { inbox?: number; children: React.ReactNode }) {
  const path = usePathname();
  const hide = HIDE_BAR.some((h) => path.startsWith(h));

  return (
    <div className={`relative flex flex-1 flex-col w-full ${hide ? 'min-h-dvh' : 'min-h-dvh pb-[88px]'}`}>
      {children}
      {!hide && <TabBar inbox={inbox} />}
    </div>
  );
}
