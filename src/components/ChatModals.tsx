'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from './ui';
import { formatMessageTime, formatDateDivider } from '@/lib/date';
import type { ChatRow, Message } from '@/lib/types';

export function DeleteMessageModal({
  message,
  isMine,
  onClose,
  onDeleteForMe,
  onDeleteForEveryone,
}: {
  message: Message | null;
  isMine: boolean;
  onClose: () => void;
  onDeleteForMe: (msg: Message) => void;
  onDeleteForEveryone: (msg: Message) => void;
}) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-bold text-ink">Delete message?</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-muted">&ldquo;{message.body}&rdquo;</p>
            <div className="mt-4 flex flex-col gap-2">
              {isMine && (
                <button
                  type="button"
                  onClick={() => onDeleteForEveryone(message)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-danger px-4 text-[13px] font-bold text-on-primary transition active:scale-95"
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeleteForMe(message)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-btn border border-line bg-surface-alt px-4 text-[13px] font-bold text-ink transition active:scale-95"
              >
                Delete for me
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center justify-center rounded-btn text-[13px] font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EditMessageModal({
  message,
  onClose,
  onSave,
}: {
  message: Message | null;
  onClose: () => void;
  onSave: (msg: Message, newBody: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(message?.body ?? '');
  }, [message]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => !saving && onClose()}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-bold text-ink">Edit message</h3>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={50000}
              rows={3}
              autoFocus
              className="mt-3 w-full rounded-input border-[1.5px] border-line bg-bg p-3 text-[15px] text-ink focus:border-primary focus:outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="flex-1 min-h-[42px] rounded-btn border border-line bg-surface text-[13px] font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !draft.trim() || draft.trim() === message.body}
                onClick={async () => {
                  setSaving(true);
                  await onSave(message, draft.trim());
                  setSaving(false);
                }}
                className="flex-1 min-h-[42px] rounded-btn bg-primary text-[13px] font-bold text-on-primary disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ForwardShareModal({
  message,
  targets,
  onClose,
  onForwardToChat,
  onShareExternal,
}: {
  message: Message | null;
  targets: ChatRow[];
  onClose: () => void;
  onForwardToChat: (target: ChatRow, msg: Message) => Promise<void>;
  onShareExternal: (msg: Message) => void;
}) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            className="w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[17px] font-bold text-ink">Forward or Share</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-bold text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <p className="mt-1.5 rounded-xl bg-surface-alt p-2.5 text-[12.5px] italic text-muted line-clamp-2">
              &ldquo;{message.body}&rdquo;
            </p>

            <button
              type="button"
              onClick={() => onShareExternal(message)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-btn border border-line bg-surface-alt py-2.5 text-[13px] font-bold text-ink transition active:scale-95"
            >
              <span>↗</span>
              <span>Share to other apps (WhatsApp, X…)</span>
            </button>

            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted">
              Forward to a Gist Bird chat
            </p>
            {targets.length === 0 ? (
              <p className="mt-2 text-[12.5px] text-muted">No other active chats right now.</p>
            ) : (
              <ul className="mt-2 max-h-[200px] space-y-1.5 overflow-y-auto">
                {targets.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={sendingId === c.id}
                      onClick={async () => {
                        setSendingId(c.id);
                        await onForwardToChat(c, message);
                        setSendingId(null);
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-line/70 bg-bg px-3 py-2 text-left transition hover:bg-surface-alt active:scale-[0.99]"
                    >
                      <Avatar name={c.other_name} scarf={c.other_scarf} avatar={c.other_avatar} size={32} />
                      <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-ink">
                        {c.other_name}
                      </span>
                      <span className="text-[12px] font-bold text-primary">
                        {sendingId === c.id ? 'Sending…' : 'Send'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MessageInfoModal({
  message,
  otherLastReadAt,
  onClose,
}: {
  message: Message | null;
  otherLastReadAt: string | null;
  onClose: () => void;
}) {
  const isRead =
    Boolean(message && otherLastReadAt) &&
    new Date(message!.created_at).getTime() <= new Date(otherLastReadAt!).getTime() + 1000;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="w-full max-w-[340px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-bold text-ink">Message Info</h3>
            <p className="mt-2 rounded-xl bg-primary/10 p-3 text-[13.5px] text-ink line-clamp-3">
              {message.body}
            </p>
            <div className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-muted">Delivered</span>
                <span className="font-bold text-ink">
                  {formatDateDivider(message.created_at)} · {formatMessageTime(message.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-muted">
                  <span className={isRead ? 'text-[#34B7F1]' : 'text-muted'}>✓✓</span>
                  <span>Read</span>
                </span>
                <span className="font-bold text-ink">
                  {isRead && otherLastReadAt
                    ? `${formatDateDivider(otherLastReadAt)} · ${formatMessageTime(otherLastReadAt)}`
                    : 'Not read yet'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full min-h-[42px] rounded-btn bg-surface-alt text-[13px] font-bold text-ink"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StarredMessagesDrawer({
  open,
  messages,
  me,
  otherName,
  onClose,
  onSelectMessage,
}: {
  open: boolean;
  messages: Message[];
  me: string;
  otherName: string;
  onClose: () => void;
  onSelectMessage: (msgId: number) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }}
            className="flex max-h-[75vh] w-full max-w-[380px] flex-col rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="font-display text-[17px] font-bold text-ink">⭐ Starred Messages</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] font-bold text-muted hover:text-ink"
              >
                Done
              </button>
            </div>
            {messages.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-muted">
                No starred messages yet. Tap any message and choose Star to save it here.
              </p>
            ) : (
              <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
                {messages.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectMessage(m.id);
                      }}
                      className="w-full rounded-xl border border-line bg-bg p-3 text-left transition hover:bg-surface-alt"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-primary">
                        <span>{m.sender_id === me ? 'You' : otherName}</span>
                        <span className="text-muted font-normal">
                          {formatDateDivider(m.created_at)} · {formatMessageTime(m.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-[13.5px] text-ink line-clamp-3">{m.body}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ClearChatModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [clearing, setClearing] = useState(false);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => !clearing && onClose()}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="w-full max-w-[340px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[17px] font-bold text-ink">Clear chat?</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              This will clear the messages in this chat for you only. Your match remains active.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={clearing}
                onClick={async () => {
                  setClearing(true);
                  await onConfirm();
                  setClearing(false);
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-danger px-4 text-[13px] font-bold text-on-primary disabled:opacity-60"
              >
                {clearing ? 'Clearing…' : 'Clear Chat'}
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center justify-center rounded-btn border border-line bg-surface text-[13px] font-bold text-muted"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
