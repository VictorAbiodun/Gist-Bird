'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Notice } from './ui';
import { STARTERS, CONTACT_UNLOCK_MESSAGES } from '@/lib/copy';
import { CONTACT_NOTICE, hasContactInfo } from '@/lib/contentFilter';
import { sendMessage } from '@/app/actions/chat';
import { Icon } from './Icon';
import BirdTypingAnimation from './BirdTypingAnimation';
import type { Message, Scarf } from '@/lib/types';

interface ChatThreadProps {
  chatId: string;
  me: string;
  initial: Message[];
  otherStarter: string | null;
  otherName: string;
  otherScarf?: Scarf;
  otherAvatar?: string | null;
  paperBody: string;
  blocked?: boolean;
}

export function ChatThread({
  chatId,
  me,
  initial,
  otherStarter,
  otherName,
  otherScarf,
  otherAvatar,
  paperBody,
  blocked: isBlocked = false,
}: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [showPaper, setShowPaper] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [pending, start] = useTransition();

  const bottom = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const lastTypingSentRef = useRef(0);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOtherTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize height with window.visualViewport to keep input firmly above mobile keyboards
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      setViewportHeight(vv.height);
      // Lock window scroll so header never disappears off top
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    setViewportHeight(vv.height);
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Real-time message subscription + live typing broadcast
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (p) => {
          const msg = p.new as Message;
          if (msg.sender_id !== me) setOtherTyping(false);
          setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.userId === me) return;
        const active = Boolean(payload.isTyping);
        setOtherTyping(active);
        if (clearOtherTypingTimerRef.current) clearTimeout(clearOtherTypingTimerRef.current);
        if (active) {
          clearOtherTypingTimerRef.current = setTimeout(() => setOtherTyping(false), 3500);
        }
      })
      .subscribe();

    channelRef.current = ch;
    return () => {
      channelRef.current = null;
      if (clearOtherTypingTimerRef.current) clearTimeout(clearOtherTypingTimerRef.current);
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      supabase.removeChannel(ch);
    };
  }, [chatId, me]);

  // Auto-scroll to bottom when messages or typing indicator update
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, otherTyping]);

  const broadcastTyping = (isTyping: boolean) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: me, isTyping },
    }).catch(() => {});
  };

  const handleTextChange = (val: string) => {
    setText(val);
    const now = Date.now();
    if (val.trim().length > 0) {
      if (now - lastTypingSentRef.current > 1100) {
        lastTypingSentRef.current = now;
        broadcastTyping(true);
      }
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2200);
    } else {
      broadcastTyping(false);
    }
  };

  const locked = messages.length < CONTACT_UNLOCK_MESSAGES;
  const hasContact = useMemo(() => locked && hasContactInfo(text), [locked, text]);
  const starters = otherStarter ? [otherStarter, ...STARTERS] : STARTERS;

  function send(body = text) {
    const trimmed = body.trim();
    if (!trimmed || (locked && hasContactInfo(trimmed))) return;
    setError(undefined);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError("You're offline. Reconnect to send your message.");
      return;
    }

    const tempId = -Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: me,
      body: trimmed,
      created_at: new Date().toISOString(),
    };

    // Optimistically show message & clear input immediately
    broadcastTyping(false);
    setMessages((m) => [...m, optimisticMsg]);
    if (body === text) setText('');
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    start(async () => {
      try {
        const r = await sendMessage({ chatId, body: trimmed });
        if (r.error) {
          setMessages((m) => m.filter((x) => x.id !== tempId));
          if (body === text) setText(trimmed);
          setError(r.error);
          return;
        }
        const { data } = await createClient()
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('id')
          .limit(300);
        if (data) setMessages(data as Message[]);
      } catch {
        setMessages((m) => m.filter((x) => x.id !== tempId));
        if (body === text) setText(trimmed);
        setError('Could not send. Check your internet connection.');
      }
    });
  }

  const handleInputFocus = () => {
    // When virtual keyboard opens on iOS/Android, ensure viewport lock and scroll to bottom
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
      bottom.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <div
      className="fixed inset-x-0 top-0 mx-auto flex w-full max-w-[480px] flex-col overflow-hidden bg-bg shadow-sm"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
    >
      {/* ── Sleek Official App Header ── */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-line bg-surface/95 px-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink active:bg-surface-alt transition"
          >
            <Icon name="back" size={20} />
          </Link>
          <Avatar name={otherName} scarf={otherScarf} avatar={otherAvatar} size={36} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-[15px] font-bold leading-5 text-ink">{otherName}</h1>
            <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
              <span className={`inline-block h-1.5 w-1.5 rounded-full bg-primary ${otherTyping ? 'animate-ping' : ''}`} />
              {otherTyping ? 'pecking a reply…' : 'Campus chat'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPaper((prev) => !prev)}
            aria-label={showPaper ? 'Hide paper' : 'View paper'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold transition active:scale-95 ${
              showPaper
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line bg-surface-alt text-ink hover:bg-line'
            }`}
          >
            <Icon name="paper" size={16} />
            <span>Paper</span>
          </button>
          <Link
            href={`/report?chat=${chatId}`}
            aria-label="Report or block"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink active:bg-surface-alt transition"
          >
            <Icon name="flag" size={17} />
          </Link>
        </div>
      </header>

      {/* ── Collapsible Original Paper Drawer ── */}
      {showPaper && (
        <div className="shrink-0 border-b border-line bg-[#FAF7F0] px-4 py-3 shadow-inner transition">
          <div className="flex items-center justify-between pb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Original Paper</p>
            <button
              type="button"
              onClick={() => setShowPaper(false)}
              className="text-[12px] font-bold text-muted hover:text-ink"
            >
              Close ✕
            </button>
          </div>
          <p className="line-clamp-4 text-label leading-relaxed text-ink">{paperBody}</p>
        </div>
      )}

      {/* ── Blocked Notice ── */}
      {isBlocked ? (
        <div className="flex-1 p-5">
          <Notice title="You blocked this person">Unblock them in Settings to keep chatting.</Notice>
        </div>
      ) : (
        <>
          {/* ── Messages Stream ── */}
          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3 overscroll-y-contain"
            aria-live="polite"
          >
            {/* Context anchor at start of chat */}
            <div className="mx-auto max-w-[90%] rounded-card border border-line bg-surface-alt/40 p-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Started with this paper</p>
              <p className="mt-1 line-clamp-3 text-label italic text-ink">&ldquo;{paperBody}&rdquo;</p>
            </div>

            {messages.map((m) => {
              const isMine = m.sender_id === me;
              return (
                <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <p
                    className={`max-w-[82%] whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-xs ${
                      isMine
                        ? 'rounded-br-[4px] bg-primary text-on-primary font-medium'
                        : 'rounded-bl-[4px] border border-line bg-surface text-ink'
                    }`}
                  >
                    {m.body}
                  </p>
                </div>
              );
            })}

            {/* ── Bird-Eating-Seed Typing Indicator ── */}
            <AnimatePresence>
              {otherTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                  aria-label={`${otherName} is typing`}
                >
                  <div className="inline-flex items-center gap-2 rounded-[18px] rounded-bl-[4px] border border-line bg-surface px-3.5 py-2 shadow-xs">
                    <BirdTypingAnimation className="h-7 w-auto" />
                    <span className="text-[12px] font-semibold text-muted">typing…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottom} />
          </div>

          {/* ── Bottom Input Section ── */}
          <div className="shrink-0 border-t border-line bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-xs">
            {messages.length === 0 && (
              <div className="mb-2 space-y-1.5">
                <p className="text-[12px] font-bold text-muted">Need a starter?</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="shrink-0 rounded-full border border-line bg-surface-alt px-3 py-1 text-[12px] font-semibold text-ink active:scale-95 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasContact && (
              <div className="mb-2">
                <Notice tone="gentle" title={CONTACT_NOTICE.title}>
                  Chat first. Share contact details later, once you know each other.
                </Notice>
              </div>
            )}

            {error && !hasContact && (
              <div className="mb-2">
                <Notice tone="err" title="Message not sent">{error}</Notice>
              </div>
            )}

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onFocus={handleInputFocus}
                maxLength={1000}
                type="text"
                autoComplete="off"
                enterKeyHint="send"
                placeholder="Say something real…"
                aria-label="Message"
                className="h-[46px] min-w-0 flex-1 rounded-input border-[1.5px] border-line bg-bg px-4 text-[16px] text-ink placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none transition"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={pending || !text.trim() || hasContact}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary text-on-primary active:scale-95 disabled:bg-line disabled:text-muted transition"
              >
                <Icon name="sent" size={20} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
