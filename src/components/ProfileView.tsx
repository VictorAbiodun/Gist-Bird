'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from './ui';
import { Icon } from './Icon';
import { DailyRewardModal } from './DailyRewardModal';
import { ProfilePreviewModal } from './ProfilePreviewModal';
import { UniversityLogo } from './UniversityLogo';
import type { Profile } from '@/lib/types';
import type { RewardStatus } from '@/lib/rewards';
import type { BirdStats } from '@/lib/bird';

interface ProfileViewProps {
  profile: Profile;
  rewardStatus: RewardStatus;
  birdStats: BirdStats;
  spotName: string;
  papersSentCount: number;
  chatsCount: number;
  unreadNotifications: number;
}

export function ProfileView({
  profile,
  rewardStatus,
  birdStats,
  spotName,
  papersSentCount,
  chatsCount,
  unreadNotifications,
}: ProfileViewProps) {
  const [rewardOpen, setRewardOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [coins, setCoins] = useState(rewardStatus.coins);
  const [papersLeft, setPapersLeft] = useState(rewardStatus.papersLeft);
  const [streak, setStreak] = useState(rewardStatus.streak);
  const [canClaim, setCanClaim] = useState(rewardStatus.canClaimToday);

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Campus Member';

  const handle = `@${(profile.user_tag || profile.display_name).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'bird'}`;
  const displayAvatar = profile.photo_url || profile.avatar;

  return (
    <main className="min-h-dvh bg-bg pb-6">
      {/* ── Top Sky/Mint Gradient Header ── */}
      <div className="bg-gradient-to-b from-[#CFEAF8] via-[#E1F3FC] to-[#EAF7F0] px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between gap-2">
          <h1 className="truncate font-display text-[24px] font-bold text-ink">
            {profile.display_name}
          </h1>

          <div className="flex items-center gap-2">
            {/* Coin Pill */}
            <button
              type="button"
              onClick={() => setRewardOpen(true)}
              aria-label={`${coins} gold coins`}
              className="flex h-10 items-center gap-1.5 rounded-full bg-surface/95 px-3 text-label font-bold text-ink shadow-xs transition active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/rewards/coin.svg" alt="" className="h-[18px] w-[18px] object-contain" />
              <span>{coins}</span>
            </button>

            {/* Notifications Bell */}
            <Link
              href="/notifications"
              aria-label={unreadNotifications ? `Notifications, ${unreadNotifications} new` : 'Notifications'}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 text-ink shadow-xs transition active:scale-95"
            >
              <Icon name="bell" size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral" />
              )}
            </Link>

            {/* Settings Gear */}
            <Link
              href="/settings"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/95 text-ink shadow-xs transition active:scale-95"
            >
              <Icon name="settings" size={20} />
            </Link>
          </div>
        </header>
      </div>

      {/* ── Rounded Content Sheet ── */}
      <div className="relative -mt-8 rounded-t-[28px] bg-bg px-5 pt-0">
        {/* Centered Overlapping Avatar */}
        <div className="flex justify-center">
          <div className="relative -mt-12">
            <div className="rounded-full border-[4px] border-[#42B0E6] bg-surface p-0.5 shadow-md">
              <Avatar
                name={profile.display_name}
                scarf={profile.scarf}
                avatar={displayAvatar}
                size={92}
              />
            </div>
            <Link
              href="/me/edit"
              aria-label="Edit profile"
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink shadow-sm transition active:scale-90"
            >
              <Icon name="pen" size={15} />
            </Link>
          </div>
        </div>

        {/* Handle, Member Since & Preview Pill */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[17px] font-bold text-ink">{handle}</p>
            <p className="text-[12px] font-medium text-muted">Member since {memberSince}</p>
            {profile.university && (
              <p className="mt-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                <UniversityLogo university={profile.university} size={16} />
                <span className="truncate">{profile.university}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E1F0FA] px-3.5 py-1.5 text-[13px] font-bold text-[#1A5A8A] transition active:scale-95"
          >
            <span>Preview</span>
            <Icon name="eye" size={16} />
          </button>
        </div>

        {/* ── Gold Coins Card ── */}
        <div className="mt-4 flex items-center justify-between rounded-[20px] border border-line bg-surface p-4 shadow-xs">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/rewards/coin.svg" alt="" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-display text-[22px] font-extrabold leading-6 text-ink">{coins}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Gold Coins</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRewardOpen(true)}
            className="rounded-full bg-[#FFD23F] px-4 py-2 text-[13px] font-bold text-ink shadow-xs transition hover:brightness-95 active:scale-95"
          >
            Get more
          </button>
        </div>

        {/* ── 2x2 Stats Grid ── */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {/* Streak */}
          <button
            type="button"
            onClick={() => setRewardOpen(true)}
            className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-4 text-left shadow-xs transition active:scale-[0.98]"
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/rewards/flame.svg" alt="" className="h-6 w-6 object-contain" />
                <span className="font-display text-[22px] font-extrabold leading-none text-ink">
                  {streak}
                </span>
              </div>
              <Icon name="chev" size={16} className="text-muted" />
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-muted">Streak</p>
          </button>

          {/* Bird XP / Level */}
          <Link
            href="/me/edit"
            className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-4 shadow-xs transition active:scale-[0.98]"
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-alt text-[13px]">
                  🕊️
                </span>
                <span className="font-display text-[22px] font-extrabold leading-none text-ink">
                  {birdStats.xp}
                </span>
              </div>
              <Icon name="chev" size={16} className="text-muted" />
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-muted">
              Bird XP · Lv.{birdStats.level}
            </p>
          </Link>

          {/* Papers Sent */}
          <Link
            href="/sent"
            className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-4 shadow-xs transition active:scale-[0.98]"
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-2">
                <Icon name="paper" size={22} />
                <span className="font-display text-[22px] font-extrabold leading-none text-ink">
                  {papersSentCount}
                </span>
              </div>
              <Icon name="chev" size={16} className="text-muted" />
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-muted">Papers sent</p>
          </Link>

          {/* Campus Chats */}
          <Link
            href="/chats"
            className="flex flex-col justify-between rounded-[20px] border border-line bg-surface p-4 shadow-xs transition active:scale-[0.98]"
          >
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center gap-2">
                <Icon name="map" size={22} />
                <span className="font-display text-[22px] font-extrabold leading-none text-ink">
                  {chatsCount}
                </span>
              </div>
              <Icon name="chev" size={16} className="text-muted" />
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-muted">Campus chats</p>
          </Link>
        </div>

        {/* ── Feature List Rows ── */}
        <div className="mt-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface shadow-xs">
          {/* Daily Rewards */}
          <button
            type="button"
            onClick={() => setRewardOpen(true)}
            className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition active:bg-surface-alt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/rewards/chest.svg" alt="" className="h-6 w-6 shrink-0 object-contain" />
            <span className="flex flex-1 items-center gap-2 font-bold text-ink">
              Daily Rewards
              {canClaim && <span className="h-2 w-2 rounded-full bg-coral" />}
            </span>
            <Icon name="chev" size={18} className="text-muted" />
          </button>

          {/* Papers Balance */}
          <Link
            href="/write"
            className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-surface-alt"
          >
            <Icon name="paper" size={22} className="shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-ink">My Papers</p>
            </div>
            <span className="text-label font-semibold text-muted">{papersLeft} left</span>
            <Icon name="chev" size={18} className="text-muted" />
          </Link>

          {/* Chief Coo & Spot */}
          <Link
            href="/me/edit"
            className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-surface-alt"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[18px]">
              🕊️
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-ink">{birdStats.name}</p>
              <p className="truncate text-[12px] text-muted">
                {birdStats.title} · {spotName}
              </p>
            </div>
            <Icon name="chev" size={18} className="text-muted" />
          </Link>

          {/* Campus Map */}
          <Link
            href="/map"
            className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-surface-alt"
          >
            <Icon name="map" size={22} className="shrink-0" />
            <span className="flex-1 font-bold text-ink">Campus &amp; Flight Map</span>
            <Icon name="chev" size={18} className="text-muted" />
          </Link>

          {/* Rules & Safety */}
          <Link
            href="/rules"
            className="flex items-center gap-3.5 px-4 py-3.5 transition active:bg-surface-alt"
          >
            <Icon name="shield" size={22} className="shrink-0 text-primary" />
            <span className="flex-1 font-bold text-ink">Campus Rules</span>
            <Icon name="chev" size={18} className="text-muted" />
          </Link>
        </div>
      </div>

      {/* ── Daily Reward Modal ── */}
      <DailyRewardModal
        open={rewardOpen}
        onClose={() => setRewardOpen(false)}
        status={rewardStatus}
        onClaimed={(nextPapers, nextCoins, nextStreak) => {
          setPapersLeft(nextPapers);
          setCoins(nextCoins);
          setStreak(nextStreak);
          setCanClaim(false);
        }}
      />

      {/* ── Profile Preview Modal ── */}
      <ProfilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          displayName: profile.display_name,
          userTag: profile.user_tag,
          avatar: profile.avatar,
          photoUrl: profile.photo_url,
          scarf: profile.scarf,
          university: profile.university,
          country: profile.country,
          age: profile.age,
          gender: profile.gender,
          bio: profile.starter_prompt,
          interests: profile.interests,
          spotName,
          xp: birdStats.xp,
          streak,
          papersSent: papersSentCount,
          isOwnProfile: true,
        }}
      />
    </main>
  );
}
