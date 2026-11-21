'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Chip, timeAgo } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { acceptPaper, openPaper } from '@/app/actions/papers';
import { createClient } from '@/lib/supabase/client';
import type { TreeEnvelope } from './treeEnvelope';

interface CinematicLetterReaderProps {
  envelope: TreeEnvelope | null;
  onClose: () => void;
  onOpenSuccess: (paperId: string, updatedBody: string | null) => void;
  onKeepSuccess: (paperId: string) => void;
}

type AnimationStage =
  | 'approaching' // Envelope detaches and glides to center
  | 'opening_flap' // 3D flap folds upward
  | 'sheet_emerging' // Folded letter emerges out of pocket
  | 'reading' // Letter expands to full parchment reading sheet
  | 'closing_sheet' // Letter folds back into envelope
  | 'closing_flap' // Flap folds back down
  | 'returning_to_branch' // Envelope glides back to branch
  | 'kept_celebration'; // Golden seal celebration on accept

export function CinematicLetterReader({
  envelope,
  onClose,
  onOpenSuccess,
  onKeepSuccess,
}: CinematicLetterReaderProps) {
  const [stage, setStage] = useState<AnimationStage>('approaching');
  const [letterBody, setLetterBody] = useState<string | null>(envelope?.body ?? null);
  const [isLoadingBody, setIsLoadingBody] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset or initialize state when a new envelope is selected
  useEffect(() => {
    if (!envelope) return;

    setStage('approaching');
    setLetterBody(envelope.body);
    setErrorMessage(null);

    // Sequence the entrance:
    // 1. Glide to center (500ms)
    const t1 = setTimeout(() => {
      setStage('opening_flap');
    }, 550);

    // 2. Open flap (400ms)
    const t2 = setTimeout(() => {
      setStage('sheet_emerging');
    }, 950);

    // 3. Emerge & expand letter into full reading sheet (450ms)
    const t3 = setTimeout(() => {
      setStage('reading');
    }, 1400);

    // Fetch the letter body if not already present or if currently landed
    if (!envelope.body) {
      setIsLoadingBody(true);
      (async () => {
        try {
          await openPaper(envelope.paperId);
          const supabase = createClient();
          const { data } = await supabase.rpc('get_paper', { p_id: envelope.paperId });
          const fetchedBody =
            data && typeof data === 'object' && 'body' in data
              ? (data as { body: string | null }).body
              : null;
          setLetterBody(fetchedBody);
          onOpenSuccess(envelope.paperId, fetchedBody);
        } catch {
          // Fallback if network hiccup
          setLetterBody(envelope.body || 'A warm message tucked into Chief Coo’s envelope.');
        } finally {
          setIsLoadingBody(false);
        }
      })();
    } else {
      // Record open state in background
      openPaper(envelope.paperId).catch(() => {});
      onOpenSuccess(envelope.paperId, envelope.body);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope?.id]);

  if (!envelope) return null;

  // Handle graceful return animation when user clicks CLOSE LETTER
  function handleCloseLetter() {
    if (stage === 'kept_celebration') return;
    setErrorMessage(null);

    // Reverse sequence:
    // 1. Fold sheet back towards envelope
    setStage('closing_sheet');

    // 2. Fold flap down
    setTimeout(() => {
      setStage('closing_flap');
    }, 380);

    // 3. Glide envelope back to exact branch anchor
    setTimeout(() => {
      setStage('returning_to_branch');
    }, 650);

    // 4. Teardown overlay and resume branch sway
    setTimeout(() => {
      onClose();
    }, 1150);
  }

  // Handle KEEP LETTER with confirmation stamp animation & Supabase persistence
  function handleKeepLetter() {
    if (!envelope || isPending || stage === 'kept_celebration') return;
    const paperId = envelope.paperId;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await acceptPaper(paperId);
        if (res.error) {
          setErrorMessage(res.error);
          return;
        }

        // Trigger celebratory seal animation
        setStage('kept_celebration');

        // Allow user to feel the satisfying stamp confirmation, then close
        setTimeout(() => {
          onKeepSuccess(paperId);
          onClose();
        }, 1100);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Could not keep letter. Please retry.');
      }
    });
  }

  const isFlapOpen =
    stage === 'opening_flap' ||
    stage === 'sheet_emerging' ||
    stage === 'reading' ||
    stage === 'closing_sheet';

  const isSheetOut = stage === 'sheet_emerging' || stage === 'closing_sheet';

  const isReading = stage === 'reading' || stage === 'kept_celebration';

  const isAtBranch = stage === 'approaching' || stage === 'returning_to_branch';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden select-none">
        {/* Cinematic Backdrop Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={stage === 'reading' ? handleCloseLetter : undefined}
          className="absolute inset-0 bg-ink/65 backdrop-blur-md"
        />

        {/* ====================================================================== */}
        {/* PHASE A & B: The 3D Envelope (Approaching, Flap Opening, Sheet Slide)   */}
        {/* ====================================================================== */}
        {!isReading && (
          <motion.div
            className="absolute pointer-events-auto"
            style={{ perspective: 1200 }}
            initial={{
              left: `${envelope.x}%`,
              top: `${envelope.y}%`,
              x: '-50%',
              y: '-50%',
              scale: 0.95,
              rotate: 0,
            }}
            animate={
              isAtBranch
                ? {
                    left: stage === 'approaching' ? '50%' : `${envelope.x}%`,
                    top: stage === 'approaching' ? '46%' : `${envelope.y}%`,
                    x: '-50%',
                    y: '-50%',
                    scale: stage === 'approaching' ? 1.45 : 1,
                    rotate: stage === 'approaching' ? [0, -3, 0] : [0, 3, 0],
                  }
                : {
                    left: '50%',
                    top: '46%',
                    x: '-50%',
                    y: '-50%',
                    scale: 1.45,
                    rotate: 0,
                  }
            }
            transition={{
              type: 'spring',
              damping: 24,
              stiffness: 160,
            }}
          >
            {/* The Envelope Physical Construct */}
            <div className="relative w-[180px] h-[140px] flex items-center justify-center">
              {/* Emerging Letter Sheet (slides up between envelope body and front flap) */}
              <motion.div
                className="absolute z-10 w-[140px] h-[95px] rounded-lg border border-[#E0D2B4] shadow-md flex flex-col justify-between p-2.5"
                style={{
                  background: 'linear-gradient(180deg, #FFFDF8 0%, #F5EEDC 100%)',
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: isSheetOut ? -55 : 0,
                  opacity: isSheetOut ? 1 : 0,
                  scale: isSheetOut ? 1.05 : 0.95,
                }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 180,
                }}
              >
                {/* Mini folded letter decoration */}
                <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-1">
                  <span className="text-[9px] font-bold tracking-wider text-primary uppercase">
                    From {envelope.fromName}
                  </span>
                  <span className="text-[10px]">🕊️</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-[#EFE5D0]" />
                  <div className="h-1.5 w-4/5 rounded-full bg-[#EFE5D0]" />
                  <div className="h-1.5 w-3/5 rounded-full bg-[#EFE5D0]" />
                </div>
              </motion.div>

              {/* Envelope Body SVG (Back body + Front pocket + 3D Flap) */}
              <div className="relative z-20 w-full h-full drop-shadow-2xl">
                <svg viewBox="0 0 256 200" className="w-full h-full overflow-visible">
                  <defs>
                    <filter id="cinematicGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#FFD86B" floodOpacity="0.45" />
                    </filter>
                    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFDF2" />
                      <stop offset="65%" stopColor="#FFF2BE" />
                      <stop offset="100%" stopColor="#FCE08B" />
                    </linearGradient>
                    <linearGradient id="flapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="100%" stopColor="#FFF6D1" />
                    </linearGradient>
                    <clipPath id="pocketClip">
                      <rect x="28" y="34" width="200" height="132" rx="18" ry="18" />
                    </clipPath>
                  </defs>

                  {/* Envelope Base Shadow & Back Wall */}
                  <g filter="url(#cinematicGlow)">
                    <rect x="28" y="34" width="200" height="132" rx="18" ry="18" fill="url(#bodyGrad)" />
                    {/* Dark inner pocket lining revealed when flap opens */}
                    <path d="M28 34 L128 106 L228 34 L228 166 L28 166 Z" fill="#E2BD68" opacity="0.4" />
                  </g>

                  {/* Front Pocket Fold (Letters slide behind this) */}
                  <g clipPath="url(#pocketClip)">
                    <path d="M24 168 L128 96 L232 168 Z" fill="#FDE496" opacity="0.85" />
                    <path d="M28 164 L106 106 M228 164 L150 106" stroke="#F0C451" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
                    <path d="M26 42 L116 116 Q128 126 140 116 L230 42 Z" fill="#E6B23A" opacity="0.25" />
                  </g>
                  <rect x="28" y="34" width="200" height="132" rx="18" ry="18" fill="none" stroke="#F2C249" strokeWidth="5" />
                </svg>

                {/* The 3D Articulated Flap (Flips 180 degrees upward on open) */}
                <motion.div
                  className="absolute top-[24px] inset-x-0 h-[65px] origin-top"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{
                    rotateX: isFlapOpen ? 180 : 0,
                    zIndex: isFlapOpen ? 5 : 25,
                  }}
                  transition={{
                    duration: 0.38,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <svg viewBox="0 0 256 90" className="w-full h-full overflow-visible">
                    <path
                      d="M24 6 L117 80 Q128 89 139 80 L232 6 Z"
                      fill="url(#flapGrad)"
                      stroke="#F2C249"
                      strokeWidth="5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================================== */}
        {/* PHASE C: The Full Parchment Letter Reading Experience                  */}
        {/* ====================================================================== */}
        {isReading && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cinematic-letter-sender"
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{
              type: 'spring',
              damping: 26,
              stiffness: 240,
            }}
            className="relative z-30 w-full max-w-[420px] max-h-[88vh] overflow-hidden rounded-[28px] border-[1.5px] border-[#E8DEC8] shadow-[0_24px_60px_rgba(20,35,25,0.35),0_4px_16px_rgba(20,35,25,0.12)] flex flex-col"
            style={{
              background: 'linear-gradient(180deg, #FFFDF8 0%, #FAF6EE 100%)',
            }}
          >
            {/* Top Parchment Seal Ribbon */}
            <div className="flex items-center justify-between border-b border-[#EFE5D0] px-5 py-3 bg-[#FAF4E6]/60 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100/90 text-sm shadow-xs">
                  💌
                </span>
                <span className="font-display text-[11px] font-bold tracking-widest uppercase text-emerald-800">
                  Delivered by Chief Coo
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseLetter}
                disabled={stage === 'kept_celebration'}
                aria-label="Close letter"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt/80 text-muted transition-colors hover:bg-line hover:text-ink active:scale-95"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* Error Notice Banner if Supabase update fails */}
            {errorMessage && (
              <div className="mx-5 mt-3 rounded-lg border border-danger/30 bg-[#FDEAE8] p-3 text-xs text-danger flex items-center justify-between gap-2">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="font-bold underline text-ink hover:text-danger"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Sender Header Section */}
            <div className="px-5 pt-4 pb-2 border-b border-[#F0E6D2]/60">
              <div className="flex items-center gap-3">
                <Avatar
                  name={envelope.fromName}
                  scarf={envelope.fromScarf}
                  avatar={envelope.fromAvatar}
                  size={48}
                />
                <div className="min-w-0 flex-1">
                  <h3
                    id="cinematic-letter-sender"
                    className="font-display text-[19px] font-bold text-ink truncate leading-tight"
                  >
                    From {envelope.fromName}
                  </h3>
                  <p className="flex items-center gap-1.5 text-caption font-medium text-muted mt-0.5">
                    {envelope.spot && (
                      <>
                        <Icon name="map" size={13} className="text-primary shrink-0" />
                        <span className="truncate max-w-[130px]">{envelope.spot}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{timeAgo(envelope.landedAt)}</span>
                  </p>
                </div>
              </div>

              {/* Sender Interest Tags */}
              {envelope.interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pb-1">
                  {envelope.interests.map((interest) => (
                    <Chip key={interest}>{interest}</Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Letter Body Area (Scrollable parchment sheet) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[140px] max-h-[46vh]">
              {isLoadingBody ? (
                <div className="space-y-3 py-4 text-center">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-caption font-medium text-muted">Unrolling Chief Coo’s delivery…</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Parchment Watermark Emblem */}
                  <div className="pointer-events-none absolute right-2 bottom-1 text-4xl opacity-10 select-none">
                    🕊️
                  </div>
                  <p className="font-display text-[17px] leading-[1.72] text-[#2C2416] select-text whitespace-pre-wrap break-words">
                    {letterBody || 'A quiet, heartfelt paper resting on your branches.'}
                  </p>
                </div>
              )}
            </div>

            {/* ====================================================================== */}
            {/* Action Buttons: KEEP LETTER vs CLOSE LETTER                            */}
            {/* ====================================================================== */}
            <div className="px-5 pt-3 pb-5 bg-gradient-to-t from-[#FAF6EE] via-[#FAF6EE]/95 to-transparent border-t border-[#EFE5D0]/80 space-y-2.5">
              {/* Primary Action: KEEP LETTER */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                disabled={isPending || stage === 'kept_celebration'}
                onClick={handleKeepLetter}
                className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-body font-bold text-white shadow-md transition-all hover:bg-[#086834] disabled:opacity-50"
              >
                <Icon name="sent" size={18} />
                <span>{isPending ? 'Keeping letter…' : 'Keep Letter'}</span>
              </motion.button>

              {/* Secondary Action: CLOSE LETTER (Returns to Branch) */}
              <button
                type="button"
                disabled={isPending || stage === 'kept_celebration'}
                onClick={handleCloseLetter}
                className="flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#D4C4A8] bg-[#F7F1E3]/70 px-4 py-2 text-label font-bold text-[#5A4B32] transition-colors hover:bg-[#F2EADB] active:scale-98"
              >
                <Icon name="back" size={16} />
                <span>Close Letter</span>
              </button>
            </div>

            {/* ====================================================================== */}
            {/* Golden Confirmation Seal Stamp Animation (Triggered on KEEP LETTER)     */}
            {/* ====================================================================== */}
            {stage === 'kept_celebration' && (
              <motion.div
                initial={{ opacity: 0, scale: 2, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', damping: 16, stiffness: 300 }}
                className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs"
              >
                <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-lemon bg-white px-7 py-5 shadow-2xl">
                  <span className="text-4xl">💌</span>
                  <p className="font-display text-heading font-extrabold text-primary">
                    Letter Kept!
                  </p>
                  <p className="text-caption font-semibold text-muted text-center">
                    Saved to your letters & chats.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
