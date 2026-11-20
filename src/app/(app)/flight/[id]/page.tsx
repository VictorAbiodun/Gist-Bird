import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPaper } from '@/lib/data';
import { createAdminClient } from '@/lib/supabase/admin';
import { FlightTracker } from '@/components/FlightTracker';
import { Header, Notice, LinkButton } from '@/components/ui';
import { Mascot } from '@/components/Mascot';

export default async function Flight({ params }: { params: { id: string } }) {
  const p = await getPaper(params.id);

  let origin = p?.origin || 'sapetro';
  let dest = p?.dest || 'chapel';
  let sentAt = p?.sent_at || new Date().toISOString();
  let landsAt = p?.lands_at || new Date(Date.now() + 60000).toISOString();
  let state = p?.state || 'flying';
  let chatId = p?.chat_id;

  // Fallback to paper lookup if getPaper was null (e.g. cross-account review or public flight link)
  if (!p) {
    const admin = createAdminClient();
    const { data: paper } = await admin
      .from('papers')
      .select('id, origin_spot, recipient_id, state, sent_at, lands_at')
      .eq('id', params.id)
      .maybeSingle();

    if (!paper) notFound();

    origin = paper.origin_spot;
    sentAt = paper.sent_at;
    landsAt = paper.lands_at || sentAt;
    state = paper.state;

    if (paper.recipient_id) {
      const { data: recProfile } = await admin
        .from('profiles')
        .select('favourite_spot')
        .eq('id', paper.recipient_id)
        .maybeSingle();
      if (recProfile?.favourite_spot) dest = recProfile.favourite_spot;
    }

    const { data: chat } = await admin
      .from('chats')
      .select('id')
      .eq('paper_id', paper.id)
      .maybeSingle();
    if (chat) chatId = chat.id;
  }

  if (state === 'returned') {
    return (
      <main>
        <Header back="/sent" />
        <div className="flex flex-col items-center gap-4 px-5 pt-6 text-center">
          <Mascot pose="curious" size={210} />
          <h1 className="text-[28px] leading-[34px]">Nobody picked it up yet</h1>
          <Notice tone="gentle" title="It happens">
            Papers are read one person at a time, and some days campus is quiet. This is not about you.
          </Notice>
          <LinkButton href={`/write?from=${params.id}`} icon="refresh" className="w-full">
            Edit and send it again
          </LinkButton>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header title={state === 'flying' ? 'On its way' : 'Paper Delivery'} back="/home" />
      <div className="space-y-4 px-5 pt-2">
        {chatId && (
          <Notice tone="ok" title="Someone accepted your paper!">
            You started a chat together.{' '}
            <Link href={`/chat/${chatId}`} className="font-bold underline">
              Open Chat →
            </Link>
          </Notice>
        )}
        <FlightTracker
          origin={origin}
          dest={dest}
          sentAt={sentAt}
          landsAt={landsAt}
        />
      </div>
    </main>
  );
}
