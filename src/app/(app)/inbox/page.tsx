import Link from 'next/link';
import { getInbox } from '@/lib/data';
import { Avatar, Card, Chip, Empty, Header, LinkButton, timeAgo } from '@/components/ui';
import { Icon } from '@/components/Icon';

export default async function Inbox() {
  const items = await getInbox();
  return (
    <main>
      <Header title="Inbox" />
      {items.length === 0 ? (
        <Empty title="No papers yet" action={<LinkButton href="/write" icon="sent" className="w-full">Write a paper</LinkButton>}>Chief Coo will bring one when someone writes. Meanwhile, why not send your own?</Empty>
      ) : (
        <ul className="space-y-3 px-5 pt-2">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/paper/${p.id}`}>
                <Card className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={p.from_name} scarf={p.from_scarf} />
                    <p className="flex-1 font-display text-heading font-bold">A paper from {p.from_name}</p>
                    <span className="text-label text-muted">{timeAgo(p.landed_at)}</span>
                  </div>
                  {p.state === 'opened' && p.body && <p className="line-clamp-2 text-muted">{p.body}</p>}
                  <div className="flex flex-wrap gap-1.5">{p.interests.map((i) => <Chip key={i}>{i}</Chip>)}</div>
                  {p.spot && <p className="flex items-center gap-1.5 text-label font-semibold text-muted"><Icon name="map" size={16} />Favourite spot: {p.spot}</p>}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
