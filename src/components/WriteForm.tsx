'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Field, inputCls, Notice } from './ui';
import { PROMPTS, MAX_PAPER, MIN_PAPER } from '@/lib/copy';
import { CONTACT_NOTICE, hasContactInfo } from '@/lib/contentFilter';
import { PICKABLE_SPOTS } from '@/lib/campus';
import { sendPaper } from '@/app/actions/papers';

export function WriteForm({ initialBody = '', defaultOrigin, left }: { initialBody?: string; defaultOrigin: string; left: number }) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [origin, setOrigin] = useState(defaultOrigin);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const len = body.trim().length;
  const blocked = useMemo(() => hasContactInfo(body), [body]);
  const ok = len >= MIN_PAPER && len <= MAX_PAPER && !blocked && left > 0;

  function send() {
    setError(undefined);
    start(async () => {
      const r = await sendPaper({ body, origin });
      if (r.error) setError(r.error); else router.push(`/flight/${r.id}`);
    });
  }

  return (
    <div className="flex min-h-[calc(100dvh-80px)] flex-col gap-4 px-5 pt-2">
      <p className="text-muted">Start with a prompt, or just write.</p>
      <div className="flex flex-wrap gap-2">{PROMPTS.map((p) => <Chip key={p} onClick={() => setBody((b) => (b ? b : p.replace('…', ' ')))}>{p}</Chip>)}</div>
      <Field label="Your paper">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} maxLength={MAX_PAPER + 40} placeholder="Write something real…" className={`${inputCls(blocked)} py-3`} aria-invalid={blocked} />
      </Field>
      <div className="flex items-center justify-between text-label text-muted">
        <span>{len < MIN_PAPER ? `${MIN_PAPER - len} more to send` : ''}</span>
        <span className={len > MAX_PAPER ? 'font-bold text-danger' : ''}>{len} / {MAX_PAPER}</span>
      </div>
      {blocked && <Notice tone="gentle" title={CONTACT_NOTICE.title}>{CONTACT_NOTICE.body}</Notice>}
      {error && !blocked && <Notice tone="err" title="Could not send">{error}</Notice>}
      <Field label="Starting spot" hint="You choose it. We never use GPS.">
        <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={`${inputCls()} h-[52px]`}>
          {PICKABLE_SPOTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="mt-auto space-y-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {left <= 0 && <Notice tone="info" title="No papers left">You ran out of papers! Claim your daily reward on the Home screen to earn more.</Notice>}
        <Button className="w-full" icon="sent" disabled={!ok || pending} onClick={send}>{pending ? 'Sending…' : 'Send with Chief Coo'}</Button>
      </div>
    </div>
  );
}
