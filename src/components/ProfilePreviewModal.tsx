'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from './ui';
import { Icon } from './Icon';
import { UniversityLogo } from './UniversityLogo';
import { extractAgeNumber, findUniversity } from '@/lib/universities';

export interface ProfilePreviewData {
  displayName: string;
  userTag?: string;
  avatar?: string;
  photoUrl?: string;
  scarf?: 'green' | 'lemon' | 'coral' | 'slate' | 'ink';
  university?: string;
  country?: string;
  age?: string;
  gender?: string;
  bio?: string | null;
  interests: string[];
  spotName?: string;
  xp?: number;
  streak?: number;
  papersSent?: number;
  isOwnProfile?: boolean;
}

export function ProfilePreviewModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ProfilePreviewData;
}) {
  const [sceneMode, setSceneMode] = useState<'scene' | 'photo'>('scene');

  if (!open) return null;

  const uni = findUniversity(data.university);
  const ageNum = extractAgeNumber(data.age);
  const displayAvatar = data.photoUrl || data.avatar || '/avatars/avatar-01.svg';
  const handle = `@${(data.userTag || data.displayName).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'bird'}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Profile preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#EEF5FA]"
    >
      <div className="mx-auto min-h-dvh w-full max-w-[480px] pb-10">
        {/* ── Top Hero Scene (Message Tree + Avatar OR Photo) ── */}
        <div className="relative h-[220px] w-full overflow-hidden bg-gradient-to-b from-[#98D4F5] to-[#D4EEFC]">
          {sceneMode === 'scene' ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/message-tree.jpg"
                alt=""
                className="h-full w-full object-cover object-center opacity-95"
              />
              {/* Avatar standing near the tree */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-end gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.avatar || '/avatars/avatar-01.svg'}
                  alt=""
                  className="h-16 w-16 object-contain drop-shadow-md"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#DCECF8]">
              <Avatar
                name={data.displayName}
                scarf={data.scarf}
                avatar={displayAvatar}
                size={130}
              />
            </div>
          )}

          {/* Top Floating Controls */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition active:scale-95"
            >
              <Icon name="back" size={22} />
            </button>

            {/* Segmented [Avatar Scene | Photo] Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur">
              <button
                type="button"
                onClick={() => setSceneMode('scene')}
                aria-label="Tree avatar view"
                className={`flex h-7 w-9 items-center justify-center rounded-full transition ${
                  sceneMode === 'scene' ? 'bg-[#DCECF9] text-[#1A5A8A]' : 'text-muted'
                }`}
              >
                <Icon name="me" size={16} />
              </button>
              <button
                type="button"
                onClick={() => setSceneMode('photo')}
                aria-label="Photo view"
                className={`flex h-7 w-9 items-center justify-center rounded-full transition ${
                  sceneMode === 'photo' ? 'bg-[#DCECF9] text-[#1A5A8A]' : 'text-muted'
                }`}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition active:scale-95"
              aria-label="Done"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* ── Identity Row ── */}
        <div className="relative px-4">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-3 min-w-0">
              <div className="-mt-10 rounded-full border-[4px] border-white bg-surface shadow-md">
                <Avatar
                  name={data.displayName}
                  scarf={data.scarf}
                  avatar={displayAvatar}
                  size={78}
                />
              </div>
              <div className="min-w-0 pb-0.5">
                <h2 className="truncate font-display text-[22px] font-extrabold leading-6 text-ink">
                  {data.displayName}
                </h2>
                <p className="truncate text-[13px] font-medium text-muted">{handle}</p>
              </div>
            </div>

            {data.isOwnProfile && (
              <Link
                href="/me/edit"
                onClick={onClose}
                className="mb-1 shrink-0 rounded-full bg-[#0A3B78] px-4 py-2 text-[12px] font-bold text-white shadow-sm transition active:scale-95"
              >
                Customize ✨
              </Link>
            )}
          </div>

          {/* ── Two Pill Cards: [University Logo + University/Country] & [XP] ── */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="flex items-center justify-center gap-2 rounded-[16px] bg-white px-3 py-3 shadow-xs">
              <UniversityLogo university={uni ?? data.university} size={22} />
              <span className="truncate font-display text-[15px] font-bold text-ink">
                {uni?.shortName || data.university || data.country || 'Nigeria'}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-[16px] bg-white px-3 py-3 shadow-xs">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E6F4FA] text-[13px]">
                🕊️
              </span>
              <span className="font-display text-[16px] font-bold text-[#2596BE]">
                {data.xp ?? 10}
              </span>
            </div>
          </div>

          {/* ── Bio, Gender/Age, Topics, University Card ── */}
          <div className="mt-3 rounded-[22px] bg-white p-5 shadow-xs">
            {/* Gender & Age Header */}
            {(data.gender || ageNum) && (
              <div className="flex items-center justify-around border-b border-[#EEF2F6] pb-3.5 mb-4 text-[15px] font-semibold text-ink">
                {data.gender && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#2596BE]">
                      {data.gender === 'Male' ? '♂' : data.gender === 'Female' ? '♀' : '✦'}
                    </span>
                    <span>{data.gender}</span>
                  </span>
                )}
                {ageNum && (
                  <span>
                    <strong className="font-display text-[17px]">{ageNum}</strong> years old
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
              {data.bio?.trim() || 'Looking forward to meeting cool people on campus!'}
            </p>

            {/* Topics of interest */}
            {data.interests.length > 0 && (
              <div className="mt-5">
                <p className="font-display text-[14px] font-bold text-muted">Topics of interest</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {data.interests.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full border border-[#DCE6EE] bg-white px-3.5 py-1.5 text-[13px] font-medium text-ink"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* University (replaces Languages spoken) */}
            <div className="mt-5">
              <p className="font-display text-[14px] font-bold text-muted">University</p>
              <div className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-[#DCE6EE] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-ink">
                <UniversityLogo university={uni ?? data.university} size={18} />
                <span>{uni?.name || data.university || 'Nigerian University'}</span>
              </div>
            </div>
          </div>

          {/* ── Achievements Card ── */}
          <div className="mt-3 rounded-[22px] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="font-display text-[16px] font-bold text-ink">
                Achievements · <span className="text-muted">{(data.papersSent ?? 0) > 0 ? 2 : 1}</span>
              </p>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4D6] border border-[#F5C542]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/rewards/flame.svg" alt="Campus Pioneer" className="h-9 w-9 object-contain" />
              </div>
              {(data.papersSent ?? 0) > 0 && (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5F4EC] border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/paper.png" alt="First Paper Sent" className="h-8 w-8 object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* ── Rewards / Gifts Received Card ── */}
          <div className="mt-3 rounded-[22px] bg-white p-5 shadow-xs">
            <p className="font-display text-[16px] font-bold text-ink">Gifts received</p>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <div className="flex flex-col items-center rounded-2xl border border-[#EEF2F6] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/rewards/flower.svg" alt="Flower" className="h-9 w-9 object-contain" />
                <span className="mt-1.5 text-[12px] font-semibold text-muted">Flower</span>
                <span className="mt-1 rounded-full bg-[#38AEE6] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {Math.max(1, data.streak ?? 0)}
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-[#EEF2F6] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/rewards/bird-seed.svg" alt="Bird Seed" className="h-9 w-9 object-contain" />
                <span className="mt-1.5 text-[12px] font-semibold text-muted">Bird Seed</span>
                <span className="mt-1 rounded-full bg-[#38AEE6] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  1
                </span>
              </div>
              <div className="flex flex-col items-center rounded-2xl border border-[#EEF2F6] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/rewards/chest.svg" alt="Chest" className="h-9 w-9 object-contain" />
                <span className="mt-1.5 text-[12px] font-semibold text-muted">Chest</span>
                <span className="mt-1 rounded-full bg-[#38AEE6] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {Math.floor((data.streak ?? 0) / 5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
