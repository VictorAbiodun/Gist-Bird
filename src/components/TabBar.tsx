'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './Icon';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/sent', label: 'Sent', icon: 'sent' },
  { href: '/chats', label: 'Chats', icon: 'chat' },
  { href: '/me', label: 'Me', icon: 'me' },
];

const HIDE = ['/chat/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

export function TabBar({ inbox = 0 }: { inbox?: number }) {
  const path = usePathname();
  if (HIDE.some((h) => path.startsWith(h))) return null;
  return (
    <nav aria-label="Main" className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + '/');
          return (
            <li key={t.href} className="flex-1">
              <Link href={t.href} aria-current={active ? 'page' : undefined} className={`relative flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-caption ${active ? 'font-bold text-primary' : 'font-semibold text-muted'}`}>
                <Icon name={t.icon} />{t.label}
                {t.href === '/home' && inbox > 0 && <span className="absolute right-[28%] top-1.5 rounded-full bg-danger px-1.5 text-[11px] font-bold leading-4 text-white">{inbox}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
