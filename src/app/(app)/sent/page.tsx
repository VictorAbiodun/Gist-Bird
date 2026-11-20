import Link from 'next/link';
import { getSent } from '@/lib/data';
import { Card, Empty, Header, LinkButton, StatusPill, timeAgo } from '@/components/ui';
import { SENT_STATUS } from '@/lib/copy';

export default async function Sent() {
  const items = await getSent();
  return (
    <main>
      <Header title="Sent" />
      {items.length === 0 ? (
        <Empty title="Nothing sent yet" action={<LinkButton href="/write" icon="sent" className="w-full">Write a paper</LinkButton>}>Your papers show up here, with where they are on their journey.</Empty>
      ) : (
        <ul className="space-y-3 px-5 pt-2">
          {items.map((p) => {
            const s = SENT_STATUS[p.state];
            return (
              <li key={p.id}>
                <Link href={p.state === 'accepted' && p.chat_id ? `/chat/${p.chat_id}` : `/flight/${p.id}`}>
                  <Card className="space-y-2">
                    <p className="line-clamp-2 font-semibold">{p.body}</p>
                    <div className="flex items-center justify-between"><StatusPill tone={s.tone}>{s.label}</StatusPill><span className="text-label text-muted">{timeAgo(p.sent_at)}</span></div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
