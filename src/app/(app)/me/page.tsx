import Link from 'next/link';
import { getProfile, papersLeft } from '@/lib/data';
import { Avatar, Card, Chip, Header } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { getSpot } from '@/lib/campus';
import { getBirdStats } from '@/lib/bird';

const Row = ({ href, title, sub }: { href: string; title: string; sub?: string }) => (
  <Link href={href} className="flex min-h-[60px] items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5">
    <div className="flex-1"><p className="font-bold">{title}</p>{sub && <p className="text-label text-muted">{sub}</p>}</div><Icon name="chev" size={20} className="text-muted" />
  </Link>
);

export default async function Me() {
  const [p, left] = await Promise.all([getProfile(), papersLeft()]);
  if (!p) return null;
  const birdStats = getBirdStats(p.created_at, p.papers_used ?? 0, p.bird_name);

  return (
    <main>
      <Header title="Me" right={<Link href="/me/edit" aria-label="Edit profile" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface"><Icon name="pen" size={22} /></Link>} />
      <div className="space-y-3 px-5 pt-2">
        <Card className="flex flex-col items-center gap-2.5 p-5">
          <Link href="/me/edit" className="relative group block" aria-label="Change profile picture">
            <Avatar name={p.display_name} scarf={p.scarf} avatar={p.avatar} size={84} />
            <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white border-2 border-white shadow-sm transition-transform group-hover:scale-105 active:scale-95">
              <Icon name="pen" size={14} />
            </span>
          </Link>
          <div className="text-center">
            <h2 className="text-title">{p.display_name}</h2>
            <Link href="/me/edit" className="text-caption font-semibold text-primary hover:underline">
              Change avatar or profile
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-2">{p.interests.map((i) => <Chip key={i}>{i}</Chip>)}</div>
        </Card>

        {/* Bird Companion Card */}
        <Card className="flex items-center gap-3.5 p-4 border-[1.5px] border-primary/20 bg-gradient-to-r from-surface to-[#EAF7EE]/60">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lemon shadow-sm">
            <span className="text-2xl">🕊️</span>
            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-white shadow-sm">
              Lv.{birdStats.level}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-display text-heading font-bold text-ink">{birdStats.name}</p>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                ⚡ +{birdStats.speedBoostPercent}% speed
              </span>
            </div>
            <p className="text-caption font-semibold text-muted">
              {birdStats.title} · {birdStats.ageDays} {birdStats.ageDays === 1 ? 'day' : 'days'} on campus
            </p>
          </div>
          <Link href="/me/edit" aria-label="Rename bird" className="text-muted hover:text-ink">
            <Icon name="pen" size={16} />
          </Link>
        </Card>

        <Row href="/me/edit" title="Favourite spot" sub={getSpot(p.favourite_spot)?.name ?? 'Not set'} />
        <Row href="/me/edit" title="Conversation starter" sub={p.starter_prompt ?? 'Not set'} />
        <Card className="flex items-center justify-between"><p className="font-bold">Papers left today</p><p className="text-label text-muted">{left} · resets at midnight</p></Card>
        <Row href="/settings" title="Settings" />
      </div>
    </main>
  );
}
