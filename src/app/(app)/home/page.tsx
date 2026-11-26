import Link from 'next/link';
import { getInbox, getNotifications, getProfile, getRewardStatus, getSent } from '@/lib/data';
import { Icon } from '@/components/Icon';
import { LinkButton } from '@/components/ui';
import { getSpot } from '@/lib/campus';
import { TreeScene } from '@/components/tree/TreeScene';
import { HomeRewardsBar } from '@/components/HomeRewardsBar';
import { PullToRefresh } from '@/components/PullToRefresh';

export default async function Home() {
  const [rewardStatus, notes, sent, inbox, profile] = await Promise.all([
    getRewardStatus(),
    getNotifications(),
    getSent(),
    getInbox(),
    getProfile(),
  ]);
  const unread = notes.filter((n) => !n.read_at).length;
  const flying = sent.find((s) => s.state === 'flying');

  return (
    <PullToRefresh>
      <main className="relative min-h-[calc(100dvh-88px)] overflow-hidden">
      <TreeScene
        fullScreen
        userId={profile?.id}
        userUniversity={profile?.university}
        inboxPapers={inbox}
        userDisplayName={profile?.display_name ?? 'You'}
        userAvatar={profile?.avatar ?? '/avatars/avatar-01.svg'}
      >
        {/* Top Header & Actions — pointer-events-auto so links work */}
        <div className="pointer-events-auto">
          <HomeRewardsBar rewardStatus={rewardStatus} unreadNotifications={unread} />

          <div className="flex items-center justify-end px-5 pt-1">
            <Link
              href="/map"
              className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white/95 px-3.5 py-2 text-label font-bold shadow-sm backdrop-blur transition-transform active:scale-95"
            >
              <Icon name="map" size={20} />
              See the map
            </Link>
          </div>
        </div>

        {/* Bottom CTA & Active Flights — pointer-events-auto so buttons work */}
        <div className="pointer-events-auto space-y-3 px-5 pb-6">
          {flying && (
            <Link
              href={`/flight/${flying.id}`}
              className="block rounded-card border-[1.5px] border-line bg-surface/95 p-3.5 shadow-md backdrop-blur transition-transform active:scale-[0.99]"
            >
              <p className="font-display text-heading font-bold text-ink">Chief Coo dey carry your paper</p>
              <p className="text-label text-muted">
                {getSpot(flying.origin)?.name}
                {flying.dest ? ` to ${getSpot(flying.dest)?.name}` : ''} · tap to follow
              </p>
            </Link>
          )}
          <LinkButton href="/write" icon="paper" className="min-h-[56px] w-full shadow-md">
            Write a paper
          </LinkButton>
        </div>
      </TreeScene>
      </main>
    </PullToRefresh>
  );
}
