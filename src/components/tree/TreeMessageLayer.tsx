'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TreeMessageLeaves } from './TreeMessageLeaves';
import { CinematicLetterReader } from './CinematicLetterReader';
import { inboxItemToEnvelope, type TreeEnvelope } from './treeEnvelope';
import { normalizeUniText, findUniversity } from '@/lib/universities';
import { UniversityLogo } from '@/components/UniversityLogo';
import { Icon } from '@/components/Icon';
import { playBirdLandSound } from '@/lib/sounds';
import type { InboxItem } from '@/lib/types';

interface TreeMessageLayerProps {
  mode?: 'full' | 'compact';
  userDisplayName?: string;
  userAvatar?: string;
  userId?: string;
  userUniversity?: string;
  initialInbox?: InboxItem[];
}

export function TreeMessageLayer({
  mode = 'full',
  userId,
  userUniversity,
  initialInbox = [],
}: TreeMessageLayerProps) {
  const router = useRouter();
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(initialInbox);
  const [activeEnvelope, setActiveEnvelope] = useState<TreeEnvelope | null>(null);
  const [campusFilter, setCampusFilter] = useState<'all' | 'campus'>('all');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('gistbird_onboarding_done');
      if (!dismissed) setShowOnboarding(true);
    }
  }, []);

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('gistbird_onboarding_done', '1');
  };

  // Sync with server-provided initial inbox
  useEffect(() => {
    if (initialInbox) {
      setInboxItems(initialInbox);
    }
  }, [initialInbox]);

  // Real-time subscription to paper arrivals and state updates for this recipient
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channelName = `tree-inbox:${userId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'papers',
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            playBirdLandSound();
          }
          // Re-fetch only this authenticated user's current unaccepted inbox via RPC
          const { data, error } = await supabase.rpc('get_inbox');
          if (!error && data) {
            setInboxItems(data as InboxItem[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const campusMatchCount = useMemo(() => {
    if (!userUniversity) return 0;
    const userNorm = normalizeUniText(userUniversity);
    return inboxItems.filter(
      (item) => item.from_university && normalizeUniText(item.from_university) === userNorm
    ).length;
  }, [inboxItems, userUniversity]);

  const filteredInbox = useMemo(() => {
    if (campusFilter === 'all' || !userUniversity) return inboxItems;
    const userNorm = normalizeUniText(userUniversity);
    return inboxItems.filter((item) => {
      if (!item.from_university) return false;
      return normalizeUniText(item.from_university) === userNorm;
    });
  }, [inboxItems, campusFilter, userUniversity]);

  // Map each qualifying unaccepted inbox message into a natural hanging envelope
  const envelopes = useMemo(() => {
    return filteredInbox.map((item, idx) => inboxItemToEnvelope(item, idx));
  }, [filteredInbox]);

  function handleOpenSuccess(paperId: string, updatedBody: string | null) {
    setInboxItems((prev) =>
      prev.map((item) =>
        item.id === paperId ? { ...item, state: 'opened', body: updatedBody ?? item.body } : item
      )
    );
  }

  function handleKeepSuccess(paperId: string) {
    setInboxItems((prev) => prev.filter((item) => item.id !== paperId));
    setActiveEnvelope(null);
    router.refresh();
  }

  return (
    <>
      {/* ── Campus Filter Floating Segmented Toggle ── */}
      <div className="pointer-events-auto absolute top-20 left-5 z-[35] flex items-center gap-1 rounded-full border-[1.5px] border-line/80 bg-surface/95 p-1 shadow-sm backdrop-blur-md">
        <button
          type="button"
          onClick={() => setCampusFilter('all')}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
            campusFilter === 'all'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Icon name="globe" size={13} />
          <span>All ({inboxItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!userUniversity) {
              setShowPrompt(true);
            } else {
              setCampusFilter('campus');
            }
          }}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition active:scale-95 ${
            campusFilter === 'campus'
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-muted hover:text-ink'
          }`}
        >
          {userUniversity && <UniversityLogo university={userUniversity} size={14} className="shrink-0" />}
          <span className="truncate max-w-[95px]">
            {userUniversity
              ? findUniversity(userUniversity)?.shortName || 'My Campus'
              : 'My Campus'}
          </span>
          {userUniversity && (
            <span
              className={`text-[10px] ${
                campusFilter === 'campus' ? 'text-white/90' : 'text-muted'
              }`}
            >
              ({campusMatchCount})
            </span>
          )}
        </button>
      </div>

      {/* When filtering to campus but no letters match */}
      {campusFilter === 'campus' && campusMatchCount === 0 && (
        <div className="pointer-events-auto absolute top-36 inset-x-6 z-[35] mx-auto max-w-[340px] rounded-2xl border border-line bg-surface/95 p-4 text-center shadow-lg backdrop-blur-md">
          <p className="font-display text-[14px] font-bold text-ink">
            No papers from {userUniversity} yet
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">
            Chief Coo hasn&rsquo;t found letters from your campus right now. Check back soon or switch to All Campuses.
          </p>
          <button
            type="button"
            onClick={() => setCampusFilter('all')}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-on-primary shadow-xs active:scale-95 transition"
          >
            <span>Show All Campuses</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {inboxItems.length}
            </span>
          </button>
        </div>
      )}

      {/* Prompt modal when user has not set their university yet */}
      {showPrompt && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[340px] rounded-2xl border border-line bg-surface p-5 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt text-primary">
                <Icon name="school" size={24} />
              </div>
              <h3 className="mt-2 font-display text-[17px] font-bold text-ink">Set your Campus</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Pick your Nigerian university in your profile to filter letters exclusively to your peers!
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/me/edit"
                className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-primary px-4 text-[13px] font-bold text-on-primary transition active:scale-95"
              >
                Choose My University
              </Link>
              <button
                type="button"
                onClick={() => setShowPrompt(false)}
                className="inline-flex min-h-[40px] items-center justify-center rounded-btn border border-line bg-surface text-[13px] font-bold text-muted transition hover:text-ink"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First-time onboarding when tree is empty */}
      {envelopes.length === 0 && campusFilter === 'all' && showOnboarding && (
        <div className="pointer-events-auto absolute inset-x-5 top-1/3 z-[35] mx-auto max-w-[340px] rounded-2xl border border-line bg-surface/95 p-5 text-center shadow-lg backdrop-blur-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot/wave.jpg" alt="" width={100} height={90} className="mx-auto rounded-xl" />
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink">Welcome to the Tree! 🌳</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            Write a paper and Chief Coo will fly it to someone on campus. If they like it, you start chatting!
          </p>
          <div className="mt-4 space-y-2">
            <Link
              href="/write"
              onClick={handleDismissOnboarding}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn bg-primary text-[14px] font-bold text-on-primary shadow-xs transition active:scale-95"
            >
              <Icon name="pen" size={16} />
              <span>Write your first paper</span>
            </Link>
            <button
              type="button"
              onClick={handleDismissOnboarding}
              className="text-[12px] font-semibold text-muted hover:text-ink"
            >
              Got it, I&rsquo;ll explore first
            </button>
          </div>
        </div>
      )}

      {/* Hanging Envelopes on the Tree Canopy */}
      <TreeMessageLeaves
        envelopes={envelopes}
        activeEnvelopeId={activeEnvelope?.id}
        onSelectEnvelope={(env) => setActiveEnvelope(env)}
      />

      {/* Full Mode Controls (for /tree dedicated page) */}
      {mode === 'full' && (
        <div className="pointer-events-none relative z-[35] flex h-full flex-col justify-between p-4">
          {/* Top Status Banner */}
          <div className="pointer-events-auto flex items-center justify-center pt-2">
            {envelopes.length > 0 ? (
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface/95 px-4 py-2 text-label font-bold text-ink shadow-md backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs">
                  📬
                </span>
                <span>
                  {envelopes.length} unaccepted {envelopes.length === 1 ? 'paper' : 'papers'} on your branches
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface/90 px-4 py-2 text-label font-medium text-muted shadow-sm backdrop-blur">
                <span>🌿</span>
                <span>Your branches are quiet — no unaccepted papers</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cinematic Letter Reader Experience */}
      <CinematicLetterReader
        envelope={activeEnvelope}
        onClose={() => setActiveEnvelope(null)}
        onOpenSuccess={handleOpenSuccess}
        onKeepSuccess={handleKeepSuccess}
      />
    </>
  );
}

