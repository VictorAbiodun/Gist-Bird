'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TreeMessageLeaves } from './TreeMessageLeaves';
import { CinematicLetterReader } from './CinematicLetterReader';
import { inboxItemToEnvelope, type TreeEnvelope } from './treeEnvelope';
import type { InboxItem } from '@/lib/types';

interface TreeMessageLayerProps {
  mode?: 'full' | 'compact';
  userDisplayName?: string;
  userAvatar?: string;
  userId?: string;
  initialInbox?: InboxItem[];
}

export function TreeMessageLayer({
  mode = 'full',
  userId,
  initialInbox = [],
}: TreeMessageLayerProps) {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(initialInbox);
  const [activeEnvelope, setActiveEnvelope] = useState<TreeEnvelope | null>(null);

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
        async () => {
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

  // Map each qualifying unaccepted inbox message into a natural hanging envelope
  const envelopes = useMemo(() => {
    return inboxItems.map((item, idx) => inboxItemToEnvelope(item, idx));
  }, [inboxItems]);

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
  }

  return (
    <>
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
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-label font-bold text-ink shadow-md backdrop-blur">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs">
                  📬
                </span>
                <span>
                  {envelopes.length} unaccepted {envelopes.length === 1 ? 'paper' : 'papers'} on your branches
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-label font-medium text-muted shadow-sm backdrop-blur">
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
