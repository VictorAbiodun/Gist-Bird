import Link from 'next/link';
import { getProfile, papersLeft } from '@/lib/data';
import { Avatar, Card, Chip, Header } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { getSpot } from '@/lib/campus';

const Row = ({ href, title, sub }: { href: string; title: string; sub?: string }) => (
  <Link href={href} className="flex min-h-[60px] items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5">
    <div className="flex-1"><p className="font-bold">{title}</p>{sub && <p className="text-label text-muted">{sub}</p>}</div><Icon name="chev" size={20} className="text-muted" />
  </Link>
);

export default async function Me() {
  const [p, left] = await Promise.all([getProfile(), papersLeft()]);
  if (!p) return null;
  return (
    <main>
      <Header title="Me" right={<Link href="/me/edit" aria-label="Edit profile" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface"><Icon name="pen" size={22} /></Link>} />
      <div className="space-y-3 px-5 pt-2">
        <Card className="flex flex-col items-center gap-2.5 p-5">
          <Avatar name={p.display_name} scarf={p.scarf} size={72} />
          <h2 className="text-title">{p.display_name}</h2>
          <div className="flex flex-wrap justify-center gap-2">{p.interests.map((i) => <Chip key={i}>{i}</Chip>)}</div>
        </Card>
        <Row href="/me/edit" title="Favourite spot" sub={getSpot(p.favourite_spot)?.name ?? 'Not set'} />
        <Row href="/me/edit" title="Conversation starter" sub={p.starter_prompt ?? 'Not set'} />
        <Card className="flex items-center justify-between"><p className="font-bold">Papers left today</p><p className="text-label text-muted">{left} · resets at midnight</p></Card>
        <Row href="/settings" title="Settings" />
      </div>
    </main>
  );
}
