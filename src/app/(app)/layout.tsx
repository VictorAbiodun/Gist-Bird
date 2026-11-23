import { redirect } from 'next/navigation';
import { getInbox, getProfile } from '@/lib/data';
import { Empty, LinkButton } from '@/components/ui';
import { AppShell } from '@/components/AppShell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect('/onboarding');
  const paused = profile.status === 'paused' && (!profile.paused_until || new Date(profile.paused_until) > new Date());
  if (paused) {
    return (
      <main>
        <Empty pose="curious" title="Your account is paused" action={<LinkButton href="/rules" variant="outline">Read the rules</LinkButton>}>
          {profile.paused_until ? `You can come back on ${new Date(profile.paused_until).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}.` : 'We will let you know when you can come back.'}
        </Empty>
      </main>
    );
  }
  const inbox = (await getInbox()).filter((i) => i.state === 'landed').length;
  return <AppShell inbox={inbox}>{children}</AppShell>;
}
