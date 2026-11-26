'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui';
import { UniversityLogo } from './UniversityLogo';
import type { FeedPost, Profile } from '@/lib/types';

interface FeedComposeModalProps {
  open: boolean;
  profile: Profile;
  quotePost?: FeedPost | null;
  onClose: () => void;
  onSubmit: (body: string, quoteOfId?: string) => Promise<{ error?: string }>;
}

export function FeedComposeModal({
  open,
  profile,
  quotePost,
  onClose,
  onSubmit,
}: FeedComposeModalProps) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setBody('');
      setError(undefined);
      setTimeout(() => textareaRef.current?.focus(), 120);
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(undefined);
    const res = await onSubmit(trimmed, quotePost?.id);
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setBody('');
      onClose();
    }
  };

  const displayAvatar = profile.photo_url || profile.avatar;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={quotePost ? 'Quote post' : 'New post'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs"
          onClick={() => !submitting && onClose()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] rounded-t-[28px] sm:rounded-[28px] border border-line bg-surface p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="text-[14px] font-semibold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!body.trim() || submitting}
                onClick={handleSubmit}
                className="rounded-full bg-primary px-5 py-1.5 text-[14px] font-bold text-on-primary transition active:scale-95 disabled:opacity-40"
              >
                {submitting ? 'Posting…' : 'Post'}
              </button>
            </div>

            {/* Composer Area */}
            <div className="flex items-start gap-3">
              <Avatar
                name={profile.display_name}
                scarf={profile.scarf}
                avatar={displayAvatar}
                size={40}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[14px] font-bold text-ink">
                    {profile.display_name}
                  </span>
                  {profile.university && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-bold text-primary">
                      <UniversityLogo university={profile.university} size={11} />
                      <span>{profile.university}</span>
                    </span>
                  )}
                </div>

                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={5000}
                  rows={5}
                  placeholder={quotePost ? 'Add your thoughts…' : "What's happening on campus?"}
                  className="mt-2 w-full resize-none bg-transparent text-[16px] leading-relaxed text-ink placeholder:text-muted focus:outline-none"
                />

                {quotePost && (
                  <div className="mt-2 rounded-2xl border border-line bg-bg/70 p-3">
                    <p className="font-display text-[12.5px] font-bold text-ink">
                      {quotePost.author.display_name}
                    </p>
                    <p className="mt-0.5 line-clamp-3 text-[13px] text-muted">{quotePost.body}</p>
                  </div>
                )}

                {error && (
                  <p className="mt-2 text-[12.5px] font-semibold text-danger">{error}</p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
