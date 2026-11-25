'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, Card, timeAgo } from './ui';
import { ProfilePreviewModal, type ProfilePreviewData } from './ProfilePreviewModal';
import type { ChatRow } from '@/lib/types';

export function ChatsListClient({
  chats,
  previews,
}: {
  chats: ChatRow[];
  previews: Record<string, ProfilePreviewData>;
}) {
  const [selectedPreview, setSelectedPreview] = useState<ProfilePreviewData | null>(null);

  return (
    <>
      <ul className="space-y-3 px-5 pt-2">
        {chats.map((c) => {
          const preview = previews[c.other_id];
          return (
            <li key={c.id}>
              <Card className="flex items-center gap-3 p-3.5 transition active:scale-[0.99]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (preview) setSelectedPreview(preview);
                  }}
                  disabled={!preview}
                  aria-label={`View ${c.other_name}'s profile`}
                  className="shrink-0 rounded-full transition active:scale-95 disabled:cursor-default"
                >
                  <Avatar name={c.other_name} scarf={c.other_scarf} avatar={c.other_avatar} size={48} />
                </button>
                <Link href={`/chat/${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-heading font-bold truncate">{c.other_name}</p>
                    <p className="truncate text-label text-muted">{c.last ?? 'Say hi!'}</p>
                  </div>
                  <span className="shrink-0 text-caption text-muted">{timeAgo(c.last_at)}</span>
                </Link>
              </Card>
            </li>
          );
        })}
      </ul>

      {selectedPreview && (
        <ProfilePreviewModal
          open={Boolean(selectedPreview)}
          onClose={() => setSelectedPreview(null)}
          data={selectedPreview}
        />
      )}
    </>
  );
}
