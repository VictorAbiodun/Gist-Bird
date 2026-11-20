import Link from 'next/link';
import { signOut } from '@/app/actions/auth';
import { Header } from '@/components/ui';
import { Icon } from '@/components/Icon';

const Row = ({ href, title }: { href: string; title: string }) => (
  <Link href={href} className="flex min-h-[56px] items-center rounded-card border-[1.5px] border-line bg-surface p-3.5 font-bold"><span className="flex-1">{title}</span><Icon name="chev" size={20} className="text-muted" /></Link>
);

export default function Settings() {
  return (
    <main>
      <Header title="Settings" back="/me" />
      <div className="space-y-3 px-5 pt-2">
        <Row href="/settings/password" title="Set or change password" />
        <Row href="/notifications" title="Notifications" />
        <Row href="/settings/blocked" title="Blocked people" />
        <Row href="/rules" title="Rules and privacy" />
        <form action={signOut}><button className="flex min-h-[56px] w-full items-center rounded-card border-[1.5px] border-line bg-surface p-3.5 text-left font-bold">Log out</button></form>
        <Link href="/settings/delete" className="flex min-h-[56px] items-center rounded-card border-[1.5px] border-line bg-surface p-3.5 font-bold text-danger">Delete account</Link>
      </div>
    </main>
  );
}
