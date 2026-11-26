'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { REWARD_DAYS, type DailyRewardItem, type RewardIconType, type RewardStatus } from '@/lib/rewards';
import { claimDailyReward } from '@/app/actions/rewards';

function RewardArtwork({ type }: { type: RewardIconType }) {
  switch (type) {
    case 'paper':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/paper.png" alt="Paper" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'papers_bundle':
      return (
        <div className="relative flex h-8 w-8 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/paper.png" alt="" className="absolute -left-0.5 top-0 h-5 w-5 -rotate-12 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/paper.png" alt="" className="absolute -right-0.5 top-0.5 h-5 w-5 rotate-12 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/paper.png" alt="Papers" className="relative z-10 mt-1.5 h-6 w-6 object-contain drop-shadow-xs" />
        </div>
      );
    case 'whistle':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/whistle.svg" alt="Whistle" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'mug':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/mug.svg" alt="Mug" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'coin':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/coin.svg" alt="Coin" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'coins_stack':
      return (
        <div className="relative flex h-8 w-8 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/rewards/coin.svg" alt="" className="absolute -left-0.5 bottom-0.5 h-5 w-5 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/rewards/coin.svg" alt="" className="absolute -right-0.5 bottom-0.5 h-5 w-5 object-contain" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/rewards/coin.svg" alt="Coins" className="relative z-10 mb-1.5 h-6 w-6 object-contain drop-shadow-xs" />
        </div>
      );
    case 'chest':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/chest.svg" alt="Treasure Chest" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'flower':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/flower.svg" alt="Flower" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'bird_seed':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/bird-seed.svg" alt="Bird Seed" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
    case 'gold':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icons/rewards/gold-bar.svg" alt="Gold Bar" className="h-7 w-7 object-contain drop-shadow-xs" />
      );
  }
}

interface DailyRewardModalProps {
  open: boolean;
  onClose: () => void;
  status: RewardStatus;
  onClaimed?: (papersLeft: number, coins: number, newStreak: number) => void;
}

export function DailyRewardModal({ open, onClose, status, onClaimed }: DailyRewardModalProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [claimedReward, setClaimedReward] = useState<DailyRewardItem | null>(null);
  const [localStatus, setLocalStatus] = useState<RewardStatus>(status);

  const displayStreak = localStatus.canClaimToday
    ? localStatus.streak + 1
    : Math.max(1, localStatus.streak);

  const handleClaim = () => {
    if (!localStatus.canClaimToday || pending) return;
    setError(undefined);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError("You're offline. Connect to the internet to claim your reward.");
      return;
    }

    const prevStatus = localStatus;
    const updatedStreak = localStatus.streak + 1;
    const dayIndex = ((updatedStreak - 1) % 20) + 1;
    const optimisticReward = REWARD_DAYS[dayIndex - 1];
    const nextPapers = localStatus.papersLeft + optimisticReward.papers;
    const nextCoins = localStatus.coins + optimisticReward.coins;

    // Optimistic immediate confirmation + confetti
    setClaimedReward(optimisticReward);
    setLocalStatus((prev) => ({
      ...prev,
      canClaimToday: false,
      streak: updatedStreak,
      todayClaimedDay: optimisticReward.day,
      currentDay: optimisticReward.day,
      papersLeft: nextPapers,
      coins: nextCoins,
    }));
    onClaimed?.(nextPapers, nextCoins, updatedStreak);

    try {
      confetti({
        particleCount: 55,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#0A7D3E', '#FFD23F', '#FF6B57', '#ffffff'],
      });
    } catch {
      // ignore confetti errors
    }

    // Persist in background
    start(async () => {
      try {
        const res = await claimDailyReward();
        if (res.error) {
          setLocalStatus(prevStatus);
          setClaimedReward(null);
          onClaimed?.(prevStatus.papersLeft, prevStatus.coins, prevStatus.streak);
          setError(res.error);
          return;
        }
        router.refresh();
      } catch {
        setLocalStatus(prevStatus);
        setClaimedReward(null);
        onClaimed?.(prevStatus.papersLeft, prevStatus.coins, prevStatus.streak);
        setError('Could not claim reward. Check your connection.');
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Daily Rewards"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 12, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative w-full max-w-[390px] overflow-visible rounded-[24px] bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
        {/* ── Wooden Chest Header with Streak Flame ── */}
        <div
          className="relative flex flex-col items-center justify-center rounded-t-[24px] border-x-[4px] border-t-[4px] border-b-[4px] border-[#F0B429] px-4 pb-5 pt-4 text-white"
          style={{
            background:
              'repeating-linear-gradient(to bottom, #7B3E1D 0px, #7B3E1D 26px, #633015 26px, #633015 28px)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close daily rewards"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/25 text-xs font-bold text-white/90 hover:bg-black/40"
          >
            ✕
          </button>

          {/* Flame with streak number */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/rewards/flame.svg" alt="" className="h-14 w-14 object-contain drop-shadow-md" />
            <span className="absolute bottom-1.5 font-display text-[24px] font-extrabold leading-none text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]">
              {displayStreak}
            </span>
          </div>

          <p className="mt-1 font-display text-[17px] font-bold tracking-wide text-white drop-shadow-xs">
            day streak!
          </p>

          {/* Golden Keyhole Badge straddling bottom edge */}
          <div className="absolute -bottom-4 left-1/2 flex h-7 w-10 -translate-x-1/2 items-center justify-center rounded-[8px] border-2 border-[#C48814] bg-[#F5C542] shadow-md">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#5C3A06]" fill="currentColor" aria-hidden="true">
              <circle cx="8" cy="5.5" r="2.3" />
              <path d="M6.8 7h2.4l.6 5.5H6.2z" />
            </svg>
          </div>
        </div>

        {/* ── 5x4 Reward Grid ── */}
        <div className="px-3.5 pb-4 pt-6">
          <div className="grid grid-cols-5 gap-1.5">
            {REWARD_DAYS.map((item) => {
              const isCurrent = item.day === localStatus.currentDay;
              const isClaimed = localStatus.canClaimToday
                ? item.day < localStatus.currentDay
                : item.day <= localStatus.currentDay;

              return (
                <div
                  key={item.day}
                  title={item.title}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-[10px] p-1 transition ${
                    isCurrent && localStatus.canClaimToday
                      ? 'bg-sky ring-2 ring-primary shadow-sm'
                      : isClaimed
                      ? 'bg-surface-alt opacity-85 ring-1 ring-primary/30'
                      : 'bg-surface-alt/50'
                  }`}
                >
                  <span
                    className={`absolute left-1.5 top-0.5 text-[10px] font-bold ${
                      isCurrent && localStatus.canClaimToday ? 'text-[#157294]' : 'text-[#6A8C9E]'
                    }`}
                  >
                    {item.day}
                  </span>

                  {isClaimed && (
                    <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                      ✓
                    </span>
                  )}

                  <div className="mt-1 flex items-center justify-center">
                    <RewardArtwork type={item.icon} />
                  </div>

                  <span className="absolute bottom-0.5 right-1.5 text-[10px] font-extrabold text-[#1E2E38]">
                    {item.displayQty}
                  </span>
                </div>
              );
            })}
          </div>

          {claimedReward && (
            <div className="mt-3 rounded-[14px] bg-surface-alt px-3 py-2 text-center text-[13px] font-bold text-primary">
              Claimed {claimedReward.title}!
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-[14px] bg-danger/15 px-3 py-2 text-center text-[12px] font-semibold text-danger">
              {error}
            </div>
          )}

          <div className="mt-3.5">
            {localStatus.canClaimToday ? (
              <button
                type="button"
                disabled={pending}
                onClick={handleClaim}
                className="w-full rounded-[16px] bg-[#F5DC8B] py-3.5 font-display text-[17px] font-bold text-[#1A1A1A] shadow-[0_3px_0_#D8B44B] transition hover:bg-[#F8E4A0] active:translate-y-[1px] disabled:opacity-60"
              >
                {pending ? 'Claiming…' : 'Claim reward'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-[16px] bg-surface-alt py-3 font-display text-[15px] font-bold text-ink transition active:scale-98"
              >
                Come back tomorrow
              </button>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
