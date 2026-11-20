'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Chip, Notice } from './ui';
import { STARTERS, CONTACT_UNLOCK_MESSAGES } from '@/lib/copy';
import { CONTACT_NOTICE, hasContactInfo } from '@/lib/contentFilter';
import { sendMessage } from '@/app/actions/chat';
import { Icon } from './Icon';
import type { Message } from '@/lib/types';

export function ChatThread({ chatId, me, initial, otherStarter }: { chatId: string; me: string; initial: Message[]; otherStarter: string | null }) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`chat:${chatId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (p) => setMessages((m) => (m.some((x) => x.id === (p.new as Message).id) ? m : [...m, p.new as Message])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [chatId]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  const locked = messages.length < CONTACT_UNLOCK_MESSAGES;
  const blocked = useMemo(() => locked && hasContactInfo(text), [locked, text]);
  const starters = otherStarter ? [otherStarter, ...STARTERS] : STARTERS;

  function send(body = text) {
    if (!body.trim() || (locked && hasContactInfo(body))) return;
    setError(undefined);
    start(async () => {
      const r = await sendMessage({ chatId, body });
      if (r.error) setError(r.error);
      else {
        setText('');
        const { data } = await createClient().from('messages').select('*').eq('chat_id', chatId).order('id').limit(300);
        if (data) setMessages(data as Message[]);
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-5 py-3" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === me ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[80%] whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2.5 ${m.sender_id === me ? 'bg-primary text-on-primary' : 'border-[1.5px] border-line bg-surface'}`}>{m.body}</p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="space-y-2 border-t border-line bg-bg px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {messages.length === 0 && (<>
          <p className="text-label font-semibold text-muted">Need a starter?</p>
          <div className="flex flex-wrap gap-2">{starters.map((s) => <Chip key={s} onClick={() => send(s)}>{s}</Chip>)}</div>
        </>)}
        {blocked && <Notice tone="gentle" title={CONTACT_NOTICE.title}>Chat first. Share contact details later, once you know each other.</Notice>}
        {error && !blocked && <Notice tone="err" title="Message not sent">{error}</Notice>}
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder="Say something real…" aria-label="Message" className="h-[52px] min-w-0 flex-1 rounded-input border-[1.5px] border-line bg-surface px-4 focus:border-primary focus:outline-none" />
          <button type="submit" aria-label="Send" disabled={pending || !text.trim() || blocked} className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-on-primary disabled:bg-line disabled:text-muted"><Icon name="sent" size={22} /></button>
        </form>
      </div>
    </div>
  );
}
