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
    return (<main><Header title="On its way" /><FlightTracker origin={p.origin} dest={p.dest} sentAt={p.sent_at} landsAt={p.lands_at} /></main>);
  }
  if (p.state === 'returned') {
    return (
      <main>
        <Header back="/sent" />
        <div className="flex flex-col items-center gap-4 px-5 pt-6 text-center">
          <Mascot pose="curious" size={210} />
          <h1 className="text-[28px] leading-[34px]">Nobody picked it up yet</h1>
          <Notice tone="gentle" title="It happens">Papers are read one person at a time, and some days campus is quiet. This is not about you.</Notice>
          <LinkButton href={`/write?from=${p.id}`} icon="refresh" className="w-full">Edit and send it again</LinkButton>
        </div>
      </main>
    );
  }
  return (
    <main>
      <div className="flex flex-col items-center gap-4 px-5 pt-16 text-center">
        <Mascot pose="cool" size={230} />
        <h1 className="text-[32px] leading-[38px] text-primary">Your paper don land</h1>
        <p className="text-heading text-muted">Someone will read it soon. If they say hi, you will hear from us.</p>
        <LinkButton href="/home" className="mt-6 w-full">Back home</LinkButton>
      </div>
    </main>
  );
}
