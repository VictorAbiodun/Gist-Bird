'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar } from './ui';
import { ProfilePreviewModal, type ProfilePreviewData } from './ProfilePreviewModal';
import type { ChatRow } from '@/lib/types';

function formatWhatsAppTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);

  if (diffDays === 0) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  return d.toLocaleDateString('en-GB');
}

export function ChatsListClient({
  chats,
  previews,
  unreadByChat = {},
}: {
  chats: ChatRow[];
  previews: Record<string, ProfilePreviewData>;
  unreadByChat?: Record<string, number>;
}) {
  const [selectedPreview, setSelectedPreview] = useState<ProfilePreviewData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <ul className="pt-1">
        {chats.map((c, idx) => {
          const preview = previews[c.other_id];
          const unread = unreadByChat[c.id] ?? 0;

          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(idx * 0.025, 0.18),
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="flex items-center gap-3.5 px-4 py-3 transition-colors duration-150 hover:bg-surface-alt/40 active:bg-surface-alt/70">
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
                  <Avatar
                    name={c.other_name}
                    scarf={c.other_scarf}
                    avatar={c.other_avatar}
                    size={52}
                  />
                </button>

                <Link
                  href={`/chat/${c.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 py-0.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-display text-[16px] font-bold leading-snug text-ink">
                        {c.other_name}
                      </p>
                      <span
                        className={`shrink-0 text-[11.5px] font-medium ${
                          unread > 0 ? 'font-bold text-primary' : 'text-muted'
                        }`}
                      >
                        {mounted ? formatWhatsAppTime(c.last_at) : ''}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[13.5px] leading-snug text-muted">
                        {c.last ?? 'Say hi!'}
                      </p>

                      {unread > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-on-primary">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            </motion.li>
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
