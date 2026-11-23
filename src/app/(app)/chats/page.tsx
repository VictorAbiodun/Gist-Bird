import Link from 'next/link';
import { getChats } from '@/lib/data';
import { Avatar, Card, Empty, Header, LinkButton, timeAgo } from '@/components/ui';

export default async function Chats() {
  const chats = await getChats();
  return (
    <main>
      <Header title="Chats" />
      {chats.length === 0 ? (
        <Empty pose="wave" title="No chats yet" action={<LinkButton href="/home" className="w-full">Check the tree</LinkButton>}>When someone accepts your paper, or you accept one from the tree, the chat starts here.</Empty>
      ) : (
        <ul className="space-y-3 px-5 pt-2">
          {chats.map((c) => (
            <li key={c.id}>
              <Link href={`/chat/${c.id}`}>
                <Card className="flex items-center gap-3 p-3.5">
                  <Avatar name={c.other_name} scarf={c.other_scarf} avatar={c.other_avatar} size={48} />
                  <div className="min-w-0 flex-1"><p className="font-display text-heading font-bold">{c.other_name}</p><p className="truncate text-label text-muted">{c.last ?? 'Say hi!'}</p></div>
                  <span className="text-caption text-muted">{timeAgo(c.last_at)}</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
