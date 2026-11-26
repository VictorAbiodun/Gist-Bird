import Link from 'next/link';
import { getNotifications } from '@/lib/data';
import { Empty, Header, timeAgo } from '@/components/ui';
import { MarkRead } from '@/components/MarkRead';

const ICONS: Record<string, string> = {
  new_message: '💬',
  paper_landed: '📬',
  paper_opened: '👀',
  paper_accepted: '🤝',
  paper_returned: '🕊️',
  message_reaction: '❤️',
  message_reply: '↩️',
};

function getGroup(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 1 && now.getDate() === d.getDate()) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return 'Earlier this week';
  return 'Older';
}

export default async function Notifications() {
  const list = await getNotifications();
  const href = (n: (typeof list)[number]) =>
    n.data.chat_id
      ? `/chat/${n.data.chat_id}`
      : n.kind === 'paper_landed'
      ? '/home'
      : n.data.paper_id
      ? `/flight/${n.data.paper_id}`
      : '/home';

  const groups: { label: string; items: typeof list }[] = [];
  const order = ['Today', 'Yesterday', 'Earlier this week', 'Older'];
  const grouped = new Map<string, typeof list>();
  for (const n of list) {
    const g = getGroup(n.created_at);
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(n);
  }
  for (const label of order) {
    const items = grouped.get(label);
    if (items && items.length > 0) groups.push({ label, items });
  }

  return (
    <main>
      <Header title="Notifications" back="/home" />
      <MarkRead any={list.some((n) => !n.read_at)} />
      {list.length === 0 ? (
        <Empty pose="cool" title="All quiet">Chief Coo will tell you when something happens.</Empty>
      ) : (
        <div className="space-y-4 px-5 pb-6 pt-2">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{g.label}</p>
              <ul className="space-y-2">
                {g.items.map((n) => (
                  <li key={n.id}>
                    <Link href={href(n)} className="flex items-start gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5 transition active:scale-[0.99]">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[16px]">
                        {ICONS[n.kind] || '📋'}
                      </span>
                      {!n.read_at && <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-coral" aria-label="New" />}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-ink">{n.title}</p>
                        {n.body && <p className="truncate text-label text-muted">{n.body}</p>}
                      </div>
                      <span className="shrink-0 text-caption text-muted">{timeAgo(n.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
