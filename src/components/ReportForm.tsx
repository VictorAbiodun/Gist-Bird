'use client';
import { useState, useTransition } from 'react';
import { Button, Field, inputCls, LinkButton, Notice } from './ui';
import { Mascot } from './Mascot';
import { reportUser } from '@/app/actions/safety';

const REASONS = [['money', 'Asked for money'], ['contact', 'Shared a number or link'], ['rude', 'Rude or hurtful'], ['uncomfortable', 'Made me uncomfortable'], ['other', 'Something else']] as const;

export function ReportForm({ paperId, chatId, back }: { paperId: string | null; chatId: string | null; back: string }) {
  const [reason, setReason] = useState<(typeof REASONS)[number][0] | null>(null);
  const [details, setDetails] = useState('');
  const [block, setBlock] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  if (done) return (
    <div className="flex flex-col items-center gap-4 px-5 pt-10 text-center">
      <Mascot pose="wave" size={170} />
      <h1 className="text-[28px] leading-[34px]">Thanks for telling us</h1>
      <p className="text-muted">A person on our team will look at this report. We will not tell them who reported.</p>
      {block && <Notice title="They are blocked">You will not see their papers or chats. You can undo this in Settings.</Notice>}
      <LinkButton href="/home" className="mt-4 w-full">Done</LinkButton>
    </div>
  );

  return (
    <div className="space-y-4 px-5 pt-2">
      <fieldset className="space-y-2">
        <legend className="mb-2 font-display text-heading font-bold">What happened?</legend>
        {REASONS.map(([k, label]) => (
          <label key={k} className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-input border px-4 ${reason === k ? 'border-2 border-primary bg-surface-alt' : 'border-[1.5px] border-line bg-surface'}`}>
            <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} className="h-5 w-5 accent-[#0A7D3E]" />
            <span className="font-semibold">{label}</span>
          </label>
        ))}
      </fieldset>
      <Field label="Anything else we should know? (optional)">
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} maxLength={500} rows={3} className={`${inputCls()} py-3`} />
      </Field>
      <label className="flex items-center gap-3 font-semibold">
        <input type="checkbox" checked={block} onChange={(e) => setBlock(e.target.checked)} className="h-6 w-6 accent-[#0A7D3E]" />Also block this person
      </label>
      {error && <Notice tone="err" title="Could not send">{error}</Notice>}
      <Button variant="danger" className="w-full" disabled={!reason || pending} onClick={() => start(async () => {
        const r = await reportUser({ reason: reason!, details: details || undefined, paperId, chatId, block });
        if (r.error) setError(r.error); else setDone(true);
      })}>{pending ? 'Sending…' : 'Send report'}</Button>
      <LinkButton href={back} variant="ghost" className="w-full">Cancel</LinkButton>
    </div>
  );
}
