'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Button, Chip, Notice, timeAgo } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { acceptPaper, openPaper, passPaper } from '@/app/actions/papers';
import { createClient } from '@/lib/supabase/client';
import type { TreeEnvelope } from './treeEnvelope';

interface MessageModalProps {
  envelope: TreeEnvelope | null;
  onClose: () => void;
  onOpenSuccess: (paperId: string, body: string | null) => void;
  onRemove: (paperId: string) => void;
}

export function MessageModal({
  envelope,
  onClose,
  onOpenSuccess,
  onRemove,
}: MessageModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  if (!envelope) return null;

  const isLanded = envelope.state === 'landed';

  async function handleOpen() {
    if (!envelope) return;
    setError(undefined);
    startTransition(async () => {
      try {
        await openPaper(envelope.paperId);
        // Query the opened paper's body using client Supabase RPC
        const supabase = createClient();
        const { data } = await supabase.rpc('get_paper', { p_id: envelope.paperId });
        const openedBody = data && typeof data === 'object' && 'body' in data ? (data as { body: string | null }).body : null;
        onOpenSuccess(envelope.paperId, openedBody);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not open paper.');
      }
    });
  }

  async function handlePass() {
    if (!envelope) return;
    setError(undefined);
    startTransition(async () => {
      const res = await passPaper(envelope.paperId);
      if (res.error) {
        setError(res.error);
      } else {
        onRemove(envelope.paperId);
        onClose();
      }
    });
  }

  async function handleAccept() {
    if (!envelope) return;
    setError(undefined);
    startTransition(async () => {
      const res = await acceptPaper(envelope.paperId);
      if (res.error) {
        setError(res.error);
      } else {
        onRemove(envelope.paperId);
        onClose();
        if (res.chatId) {
          router.push(`/chat/${res.chatId}`);
        } else {
          router.push('/chats');
        }
      }
    });
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tree-envelope-author"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-[390px] overflow-hidden rounded-[24px] border-[1.5px] border-line bg-surface p-5 shadow-2xl"
        >
          {/* Top Banner Ribbon */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Image src="/assets/envelope.svg" alt="" width={28} height={22} className="shrink-0" />
              <span className="font-display text-caption font-bold tracking-wider uppercase text-primary">
                {isLanded ? 'Unaccepted Paper · Sealed' : 'Unaccepted Paper · Opened'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close message"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-muted transition-colors hover:bg-line hover:text-ink"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {error && (
            <div className="mt-3">
              <Notice tone="err" title="Notice">{error}</Notice>
            </div>
          )}

          {/* Author Header */}
          <div className="mt-4 flex items-center gap-3">
            <Avatar
              name={envelope.fromName}
              scarf={envelope.fromScarf}
              avatar={envelope.fromAvatar}
              size={46}
            />
            <div className="min-w-0 flex-1">
              <h3 id="tree-envelope-author" className="font-display text-heading font-bold text-ink">
                From {envelope.fromName}
              </h3>
              <p className="flex items-center gap-1.5 text-caption font-medium text-muted">
                {envelope.spot && (
                  <>
                    <Icon name="map" size={13} className="text-primary shrink-0" />
                    <span className="truncate">{envelope.spot}</span>
                    <span>·</span>
                  </>
                )}
                <span>{timeAgo(envelope.landedAt)}</span>
              </p>
            </div>
            <Chip>{isLanded ? 'Sealed' : 'Opened'}</Chip>
          </div>

          {/* Interests Chips */}
          {envelope.interests.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {envelope.interests.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          )}

          {/* Paper Content: Sealed Teaser vs Opened Body */}
          {isLanded ? (
            <div className="mt-4 rounded-input border border-amber-200 bg-[#FFFDF5] p-4 text-center">
              <div className="mx-auto mb-2">
                <Image src="/assets/envelope.svg" alt="Sealed envelope" width={64} height={50} />
              </div>
              <p className="font-display text-heading font-bold text-ink">
                A paper is resting on your branch
              </p>
              <p className="mt-1 text-label text-muted">
                The words stay sealed until you open it. Opening keeps it on your tree until you decide to accept or pass.
              </p>
            </div>
          ) : (
            <div className="mt-4 max-h-[180px] overflow-y-auto rounded-input bg-surface-alt/80 p-4">
              <p className="font-display text-[18px] leading-relaxed text-ink select-text">
                {envelope.body || 'A quiet paper resting on your branches.'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 space-y-2.5">
            {isLanded ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  disabled={pending}
                  onClick={handlePass}
                >
                  Pass
                </Button>
                <Button
                  className="flex-1"
                  icon="mail"
                  disabled={pending}
                  onClick={handleOpen}
                >
                  {pending ? 'Opening…' : 'Open Paper'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-center text-caption text-muted">
                  Passing is private. Accepting moves it to your Chats.
                </p>
                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={pending}
                    onClick={handlePass}
                  >
                    Pass
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={pending}
                    onClick={handleAccept}
                  >
                    {pending ? 'Accepting…' : 'Accept & Chat'}
                  </Button>
                </div>
              </div>
            )}

            <div className="pt-1 text-center">
              <Link
                href={`/paper/${envelope.paperId}`}
                className="text-caption font-semibold text-muted hover:text-primary transition-colors"
              >
                View full screen paper details →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
