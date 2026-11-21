'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Field, inputCls } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { PICKABLE_SPOTS } from '@/lib/campus';
import type { TreeMessage } from './mockMessages';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostMessage: (newMessage: TreeMessage) => void;
  userDisplayName?: string;
  userAvatar?: string;
}

export function NewMessageModal({
  isOpen,
  onClose,
  onPostMessage,
  userDisplayName = 'You',
  userAvatar = '/avatars/avatar-01.svg',
}: NewMessageModalProps) {
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'campus' | 'wholesome' | 'gist'>('wholesome');
  const [spot, setSpot] = useState(PICKABLE_SPOTS[0]?.name || 'Peace Park');

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 10) return;

    // Randomize pin position in the tree canopy (x: 35-85%, y: 16-42%)
    const x = Math.round(36 + Math.random() * 48);
    const y = Math.round(16 + Math.random() * 26);

    const colors: Record<'campus' | 'wholesome' | 'gist', string> = {
      campus: '#0A7D3E',
      wholesome: '#FFD23F',
      gist: '#FF6B57',
    };

    const newMsg: TreeMessage = {
      id: `user-msg-${Date.now()}`,
      authorName: userDisplayName,
      authorAvatar: userAvatar,
      authorScarf: 'green',
      spot,
      body: body.trim(),
      category,
      createdAt: 'Just now',
      reactions: { hearts: 1, flutters: 1 },
      x,
      y,
      colorTheme: colors[category],
    };

    onPostMessage(newMsg);
    try {
      confetti({
        particleCount: 45,
        spread: 55,
        origin: { y: 0.6 },
        colors: ['#0A7D3E', '#FFD23F', '#FF6B57', '#72B35B'],
      });
    } catch {
      /* ignore */
    }

    setBody('');
    onClose();
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
          aria-labelledby="hang-note-title"
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-[24px] border-[1.5px] border-line bg-surface p-5 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF7EE] text-sm">
                🍃
              </span>
              <h3 id="hang-note-title" className="font-display text-heading font-bold text-ink">
                Hang a Note on the Tree
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-muted transition-colors hover:bg-line hover:text-ink"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Note text */}
            <Field label="Your note for campus" hint={`${200 - body.length} characters left`}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 200))}
                placeholder="Share a wholesome thought, exam motivation, or a funny campus moment..."
                rows={3}
                required
                className={`${inputCls} resize-none py-2.5 text-[15px]`}
              />
            </Field>

            {/* Category Pick */}
            <div className="space-y-1.5">
              <label className="text-caption font-bold text-muted uppercase tracking-wider">
                Category
              </label>
              <div className="flex gap-2">
                {(['wholesome', 'campus', 'gist'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 rounded-full border px-2.5 py-1.5 text-caption font-bold capitalize transition-all ${
                      category === cat
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-line bg-surface text-ink hover:bg-surface-alt'
                    }`}
                  >
                    {cat === 'wholesome' && '💛 '}
                    {cat === 'campus' && '🍃 '}
                    {cat === 'gist' && '💌 '}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Campus Spot */}
            <Field label="Campus spot">
              <select
                value={spot}
                onChange={(e) => setSpot(e.target.value)}
                className={inputCls()}
              >
                {PICKABLE_SPOTS.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 min-h-[48px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={body.trim().length < 10}
                className="flex-1 min-h-[48px] shadow-sm"
              >
                Hang note 🍃
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
