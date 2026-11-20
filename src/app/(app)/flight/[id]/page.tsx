import { notFound, redirect } from 'next/navigation';
import { getPaper } from '@/lib/data';
import { FlightTracker } from '@/components/FlightTracker';
import { Header, Notice, LinkButton } from '@/components/ui';
import { Mascot } from '@/components/Mascot';

export default async function Flight({ params }: { params: { id: string } }) {
  const p = await getPaper(params.id);
  if (!p || p.role !== 'author') notFound();
  if (p.state === 'accepted' && p.chat_id) redirect(`/chat/${p.chat_id}`);

  if (p.state === 'flying' && p.lands_at) {
    return (
      <main>
        <Header title="On its way" />
        <FlightTracker origin={p.origin} dest={p.dest} sentAt={p.sent_at} landsAt={p.lands_at} />
      </main>
    );
  }
  if (p.state === 'returned') {
    return (
      <main>
        <Header back="/sent" />
        <div className="flex flex-col items-center gap-4 px-5 pt-6 text-center">
          <Mascot pose="curious" size={210} />
          <h1 className="text-[28px] leading-[34px]">Nobody picked it up yet</h1>
          <Notice tone="gentle" title="It happens">
            Papers are read one person at a time, and some days campus is quiet. This is not about you.
          </Notice>
          <LinkButton href={`/write?from=${p.id}`} icon="refresh" className="w-full">
            Edit and send it again
          </LinkButton>
        </div>
      </main>
    );
  }

  // Landed / delivered state
  return (
    <main>
      <Header title="Paper Delivery" back="/home" />
      <div className="space-y-4 px-5 pt-2">
        <FlightTracker
          origin={p.origin}
          dest={p.dest}
          sentAt={p.sent_at}
          landsAt={p.lands_at ?? p.sent_at}
        />
      </div>
    </main>
  );
}
