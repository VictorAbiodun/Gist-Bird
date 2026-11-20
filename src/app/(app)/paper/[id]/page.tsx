import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPaper } from '@/lib/data';
import { PaperActions } from '@/components/PaperActions';
import { Avatar, Card, Chip, Header, timeAgo } from '@/components/ui';
import { Icon } from '@/components/Icon';

export default async function PaperPage({ params }: { params: { id: string } }) {
  const p = await getPaper(params.id);
  if (!p || p.role !== 'recipient' || (p.state !== 'landed' && p.state !== 'opened')) notFound();
  const opened = p.state === 'opened';
  return (
    <main className="flex min-h-dvh flex-col">
      <Header back="/inbox" right={<Link href={`/report?paper=${p.id}`} aria-label="Report or block" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface"><Icon name="flag" size={22} /></Link>} />
      <div className="flex-1 space-y-4 px-5 pt-2">
        <Card className="space-y-4 p-5">
          <div className="flex items-center gap-3"><Avatar name={p.from_name!} scarf={p.from_scarf!} avatar={p.from_avatar} size={48} /><div><p className="font-display text-title">{opened ? `From ${p.from_name}` : `A paper from ${p.from_name}`}</p><p className="text-label text-muted">{p.lands_at ? timeAgo(p.lands_at) : ''}</p></div></div>
          {opened ? <p className="font-display text-[22px] leading-[30px]">{p.body}</p> : <p className="rounded-input bg-surface-alt p-4 text-center text-muted">The words stay hidden until you open it.</p>}
          <div className="flex flex-wrap gap-2">{p.interests?.map((i) => <Chip key={i}>{i}</Chip>)}</div>
          {p.spot && <p className="flex items-center gap-2 rounded-input bg-surface-alt px-3 py-2.5 text-label font-semibold"><Icon name="map" size={18} className="text-primary" />Favourite spot: {p.spot}</p>}
        </Card>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"><PaperActions id={p.id} state={p.state as 'landed' | 'opened'} /></div>
    </main>
  );
}
