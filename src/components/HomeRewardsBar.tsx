'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';
import { DailyRewardModal } from './DailyRewardModal';
import type { RewardStatus } from '@/lib/rewards';

interface HomeRewardsBarProps {
  rewardStatus: RewardStatus;
  unreadNotifications: number;
}

export function HomeRewardsBar({ rewardStatus, unreadNotifications }: HomeRewardsBarProps) {
  const [open, setOpen] = useState(false);
  const [papersLeft, setPapersLeft] = useState(rewardStatus.papersLeft);
  const [coins, setCoins] = useState(rewardStatus.coins);
  const [canClaim, setCanClaim] = useState(rewardStatus.canClaimToday);

  // Sync if server props refresh
  useEffect(() => {
    setPapersLeft(rewardStatus.papersLeft);
    setCoins(rewardStatus.coins);
    setCanClaim(rewardStatus.canClaimToday);
  }, [rewardStatus.papersLeft, rewardStatus.coins, rewardStatus.canClaimToday]);

  // Auto-open daily reward modal once per day/session when claimable
  useEffect(() => {
    if (!rewardStatus.canClaimToday) return;
    const key = `gistbird_reward_seen_${new Date().toISOString().slice(0, 10)}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(key, '1');
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [rewardStatus.canClaimToday]);

  return (
    <>
      <header className="flex items-center gap-2 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <span className="flex-1 font-display text-[25px] font-bold leading-8 text-primary drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]">
          Gist Bird
        </span>

        {/* Finite Papers Counter */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${papersLeft} ${papersLeft === 1 ? 'paper' : 'papers'} left. Tap for daily rewards`}
          className="relative flex items-center gap-1.5 rounded-full bg-lemon px-3 py-1.5 text-label font-bold shadow-sm transition-transform active:scale-95"
        >
          <Icon name="paper" size={18} />
          <span>{papersLeft}</span>
          {canClaim && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-white animate-pulse" />
          )}
        </button>

        {/* Coins Counter */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${coins} coins. Tap for daily rewards`}
          className="flex items-center gap-1.5 rounded-full border-[1.5px] border-line bg-surface/95 px-2.5 py-1.5 text-label font-bold shadow-sm backdrop-blur transition-transform active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/rewards/coin.svg" alt="" className="h-[18px] w-[18px] object-contain" />
          <span>{coins}</span>
        </button>

        {/* Notifications Bell */}
        <Link
          href="/notifications"
          aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} new` : 'Notifications'}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface/95 shadow-sm backdrop-blur transition-transform active:scale-95"
        >
          <Icon name="bell" size={22} />
          {unreadNotifications > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" />}
        </Link>
      </header>

      <DailyRewardModal
        open={open}
        onClose={() => setOpen(false)}
        status={rewardStatus}
        onClaimed={(nextPapers, nextCoins) => {
          setPapersLeft(nextPapers);
          setCoins(nextCoins);
          setCanClaim(false);
        }}
      />
    </>
  );
}
