import Link from 'next/link';
import Image from 'next/image';
import { getNotifications, getSent, papersLeft } from '@/lib/data';
import { HOME_BIRD } from '@/lib/assets';
import { Icon } from '@/components/Icon';
import { LinkButton } from '@/components/ui';
import { getSpot } from '@/lib/campus';

export default async function Home() {
  const [left, notes, sent] = await Promise.all([papersLeft(), getNotifications(), getSent()]);
  const unread = notes.filter((n) => !n.read_at).length;
  const flying = sent.find((s) => s.state === 'flying');
  return (
    <main className="relative min-h-[calc(100dvh-88px)] overflow-hidden">
      <Image src={HOME_BIRD} alt="" fill priority unoptimized className="-z-10 object-cover" />
      <header className="flex items-center gap-2.5 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <span className="flex-1 font-display text-[26px] font-bold leading-8 text-primary">Gist Bird</span>
        <span className="rounded-full bg-lemon px-3 py-2 text-label font-bold">{left} {left === 1 ? 'paper' : 'papers'} left</span>
        <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'} className="relative flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface">
          <Icon name="bell" size={22} />{unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" />}
        </Link>
      </header>
      <div className="flex items-center justify-between px-5">
        <Link href="/tree" className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white/90 px-3.5 py-2.5 text-label font-bold shadow-sm backdrop-blur transition-transform active:scale-95">
          🌳 The Message Tree
        </Link>
        <Link href="/map" className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white/90 px-3.5 py-2.5 text-label font-bold shadow-sm backdrop-blur transition-transform active:scale-95">
          <Icon name="map" size={18} />See the map
        </Link>
      </div>
      <div className="absolute inset-x-0 bottom-0 space-y-3 px-5 pb-6">
        {flying && (
          <Link href={`/flight/${flying.id}`} className="block rounded-card border-[1.5px] border-line bg-surface p-3.5">
            <p className="font-display text-heading font-bold">Chief Coo dey carry your paper</p>
            <p className="text-label text-muted">{getSpot(flying.origin)?.name}{flying.dest ? ` to ${getSpot(flying.dest)?.name}` : ''} · tap to follow</p>
          </Link>
        )}
        <LinkButton href="/write" icon="sent" className="min-h-[56px] w-full">Write a paper</LinkButton>
      </div>
    </main>
  );
}
