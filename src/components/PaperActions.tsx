'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Notice } from './ui';
import { acceptPaper, openPaper, passPaper } from '@/app/actions/papers';

export function PaperActions({ id, state }: { id: string; state: 'landed' | 'opened' }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const run = (fn: () => Promise<void>) => start(async () => { setError(undefined); await fn(); });
  return (
    <div className="space-y-2">
      {error && <Notice tone="err" title="That didn't work">{error}</Notice>}
      {state === 'landed' ? (<>
        <Button className="w-full" icon="mail" disabled={pending} onClick={() => run(async () => { await openPaper(id); router.refresh(); })}>Open</Button>
        <Button variant="ghost" className="w-full" disabled={pending} onClick={() => run(async () => { const r = await passPaper(id); if (r.error) setError(r.error); else router.push('/home'); })}>Pass</Button>
      </>) : (<>
        <p className="text-caption text-muted">Passing is private. They will never know.</p>
        <div className="flex gap-2.5">
          <Button variant="outline" className="flex-1" disabled={pending} onClick={() => run(async () => { const r = await passPaper(id); if (r.error) setError(r.error); else router.push('/home'); })}>Pass</Button>
          <Button className="flex-1" disabled={pending} onClick={() => run(async () => { const r = await acceptPaper(id); if (r.error) setError(r.error); else router.push(`/chat/${r.chatId}`); })}>Accept</Button>
        </div>
      </>)}
    </div>
  );
}
