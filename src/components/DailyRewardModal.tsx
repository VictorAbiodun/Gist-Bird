'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <path d="M8 15c0-3.5 3-6 7-6h11c2.2 0 4 1.8 4 4s-1.8 4-4 4h-3.5l-1.5 2.5C19.5 22 17 24 13.5 24 10 24 8 21.5 8 18.5V15z" fill="#4BA3E3" stroke="#226CA8" strokeWidth="1.8" />
          <circle cx="14" cy="17" r="3" fill="#226CA8" />
          <circle cx="6.5" cy="14" r="2.2" fill="none" stroke="#90CAF9" strokeWidth="1.6" />
        </svg>
      );
    case 'mug':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <rect x="9" y="12" width="14" height="16" rx="3" fill="#FFC83D" stroke="#C68B17" strokeWidth="1.6" />
          <path d="M23 15h3a3 3 0 010 6h-3" fill="none" stroke="#C68B17" strokeWidth="2" />
          <path d="M8 12c0-2.5 2-4 4-4 1-1.5 4-1.5 5 0 2 0 4 1.5 4 4H8z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        </svg>
      );
    case 'coin':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <circle cx="18" cy="18" r="11" fill="#FFD23F" stroke="#D49415" strokeWidth="2" />
          <circle cx="18" cy="18" r="7.5" fill="#FFE270" stroke="#E5A924" strokeWidth="1.2" />
          <circle cx="18" cy="18" r="2.5" fill="#D49415" opacity="0.45" />
        </svg>
      );
    case 'coins_stack':
      return (
        <svg viewBox="0 0 36 36" className="h-8 w-8 drop-shadow-xs" aria-hidden="true">
          <ellipse cx="18" cy="26" rx="9" ry="3.5" fill="#E5A924" stroke="#B87D10" strokeWidth="1.4" />
          <ellipse cx="18" cy="22" rx="9" ry="3.5" fill="#FFD23F" stroke="#B87D10" strokeWidth="1.4" />
          <ellipse cx="18" cy="18" rx="9" ry="3.5" fill="#FFE270" stroke="#B87D10" strokeWidth="1.4" />
          <ellipse cx="18" cy="14" rx="9" ry="3.5" fill="#FFD23F" stroke="#B87D10" strokeWidth="1.4" />
          <ellipse cx="18" cy="10" rx="9" ry="3.5" fill="#FFE88A" stroke="#B87D10" strokeWidth="1.4" />
        </svg>
      );
    case 'chest':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <rect x="6" y="14" width="24" height="14" rx="3" fill="#B84A24" stroke="#7A2A10" strokeWidth="1.6" />
          <path d="M6 16c0-4.5 3-7 12-7s12 2.5 12 7H6z" fill="#D95E32" stroke="#7A2A10" strokeWidth="1.6" />
          <rect x="10" y="9.5" width="3" height="18.5" fill="#FFD23F" />
          <rect x="23" y="9.5" width="3" height="18.5" fill="#FFD23F" />
          <rect x="15.5" y="14.5" width="5" height="5" rx="1" fill="#FFD23F" stroke="#9C6B0D" strokeWidth="1.2" />
        </svg>
      );
    case 'pearl':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <path d="M6 21c0-6 5-10 12-10s12 4 12 10c-3 4-7 6-12 6s-9-2-12-6z" fill="#FF8DA1" stroke="#D1566E" strokeWidth="1.6" />
          <path d="M8 22c2 3 6 4.5 10 4.5s8-1.5 10-4.5" fill="#FFB8C6" />
          <circle cx="18" cy="20" r="4.2" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <path
            d="M18 6l3.4 7.2 7.9 1-5.8 5.5 1.5 7.8L18 23.8l-7 3.7 1.5-7.8-5.8-5.5 7.9-1z"
            fill="#FF6B7B"
            stroke="#C93D4D"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'gold':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7 drop-shadow-xs" aria-hidden="true">
          <path d="M7 23l5-9h14l-5 9H7z" fill="#FFE566" stroke="#C98A12" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 23l2 4h14l3-4" fill="#F2B632" stroke="#C98A12" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
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

  if (!open) return null;

  const displayStreak = localStatus.canClaimToday
    ? localStatus.streak + 1
    : Math.max(1, localStatus.streak);

  const handleClaim = () => {
    if (!localStatus.canClaimToday || pending) return;
    setError(undefined);
    start(async () => {
      const res = await claimDailyReward();
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.reward) {
        setClaimedReward(res.reward);
        const updatedStreak = res.newStreak ?? localStatus.streak + 1;
        setLocalStatus((prev) => ({
          ...prev,
          canClaimToday: false,
          streak: updatedStreak,
          todayClaimedDay: res.reward!.day,
          currentDay: res.reward!.day,
          papersLeft: res.papersLeft ?? prev.papersLeft + res.reward!.papers,
          coins: res.coins ?? prev.coins + res.reward!.coins,
        }));
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
        onClaimed?.(
          res.papersLeft ?? localStatus.papersLeft + res.reward.papers,
          res.coins ?? localStatus.coins + res.reward.coins,
          updatedStreak
        );
        router.refresh();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daily Rewards"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[390px] overflow-visible rounded-[24px] bg-white shadow-2xl"
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
            <svg viewBox="0 0 64 64" className="h-14 w-14 drop-shadow-md" aria-hidden="true">
              <path
                d="M32 4c2 10 14 16 14 30a14 14 0 11-28 0c0-6 3-11 6-15-1 5 2 8 4 8-2-9 1-17 4-23z"
                fill="#FF8C1A"
              />
              <path
                d="M32 16c1.5 6 8 10 8 19a8 8 0 11-16 0c0-4 2-7 4-10 0 3 2 5 3 5-1-5 0-9 1-14z"
                fill="#FFD23F"
              />
            </svg>
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
                      ? 'bg-[#D2EFFA] ring-2 ring-[#2596BE] shadow-sm'
                      : isClaimed
                      ? 'bg-[#E5F4EC] opacity-85 ring-1 ring-[#0A7D3E]/30'
                      : 'bg-[#E6F4FA]'
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
            <div className="mt-3 rounded-[14px] bg-[#FBE3E0] px-3 py-2 text-center text-[12px] font-semibold text-danger">
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
      </div>
    </div>
  );
}
