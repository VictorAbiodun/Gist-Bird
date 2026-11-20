import Link from 'next/link';
import { getNotifications } from '@/lib/data';
import { Empty, Header, timeAgo } from '@/components/ui';
import { MarkRead } from '@/components/MarkRead';

export default async function Notifications() {
  const list = await getNotifications();
  const href = (n: (typeof list)[number]) => n.data.chat_id ? `/chat/${n.data.chat_id}` : n.kind === 'paper_landed' && n.data.paper_id ? `/paper/${n.data.paper_id}` : n.data.paper_id ? `/flight/${n.data.paper_id}` : '/home';
  return (
    <main>
      <Header title="Notifications" back="/home" />
      <MarkRead any={list.some((n) => !n.read_at)} />
      {list.length === 0 ? <Empty pose="cool" title="All quiet">Chief Coo will tell you when something happens.</Empty> : (
        <ul className="space-y-2.5 px-5 pt-2">
          {list.map((n) => (
            <li key={n.id}>
              <Link href={href(n)} className="flex items-start gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5">
                {!n.read_at && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-coral" aria-label="New" />}
                <div className="flex-1"><p className="font-bold">{n.title}</p>{n.body && <p className="text-label text-muted">{n.body}</p>}</div>
                <span className="text-caption text-muted">{timeAgo(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
