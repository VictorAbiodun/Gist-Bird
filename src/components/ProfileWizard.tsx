'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Field, inputCls, Notice, Header } from './ui';
import { CampusMap } from './CampusMap';
import { INTERESTS, randomAlias } from '@/lib/copy';
import { SCARF_HEX, type Scarf } from '@/lib/types';
import { getSpot } from '@/lib/campus';
import { finishOnboarding, saveProfile, type ProfileInput } from '@/app/actions/profile';

const STEPS = ['name', 'interests', 'spot', 'starter'] as const;

export function ProfileWizard({ initial, mode = 'onboarding' }: { initial?: Partial<ProfileInput>; mode?: 'onboarding' | 'edit' }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [v, setV] = useState<ProfileInput>({
    displayName: initial?.displayName ?? '', nameMode: initial?.nameMode ?? 'real', scarf: initial?.scarf ?? 'green',
    interests: initial?.interests ?? [], spot: initial?.spot ?? null, starter: initial?.starter ?? '',
  });
  const set = <K extends keyof ProfileInput>(k: K, val: ProfileInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const valid = [v.displayName.trim().length >= 2, true, !!v.spot, true][step];
  const last = step === STEPS.length - 1;

  function next() {
    setError(undefined);
    if (!last) return setStep(step + 1);
    start(async () => {
      const payload = { ...v, starter: v.starter?.trim() || null };
      if (mode === 'onboarding') { const r = await finishOnboarding(payload); if (r?.error) setError(r.error); }
      else { const r = await saveProfile(payload); if (r.error) setError(r.error); else router.push('/me'); }
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header back={step > 0 ? undefined : mode === 'edit' ? '/me' : undefined} right={step > 0 ? <Button variant="ghost" className="min-h-[44px] px-3" onClick={() => setStep(step - 1)}>Back</Button> : undefined} />
      <div className="flex gap-1.5 px-5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />)}
      </div>
      <div className="flex-1 space-y-4 px-5 pt-6">
        {step === 0 && (<>
          <h1 className="text-[28px] leading-[34px]">How should we show you?</h1>
          <p className="text-muted">Use your real name or an alias. You can change it any time.</p>
          <div className="flex gap-2" role="group" aria-label="Name type">
            <Chip selected={v.nameMode === 'real'} onClick={() => set('nameMode', 'real')}>Real name</Chip>
            <Chip selected={v.nameMode === 'alias'} onClick={() => { set('nameMode', 'alias'); if (!v.displayName) set('displayName', randomAlias()); }}>Alias</Chip>
          </div>
          <Field label={v.nameMode === 'real' ? 'Your name' : 'Your alias'} hint="2 to 24 characters.">
            <input value={v.displayName} maxLength={24} onChange={(e) => set('displayName', e.target.value)} className={`${inputCls()} h-[52px]`} autoComplete={v.nameMode === 'real' ? 'given-name' : 'off'} />
          </Field>
          {v.nameMode === 'alias' && <Button variant="outline" icon="refresh" onClick={() => set('displayName', randomAlias())}>Try another alias</Button>}
          <fieldset>
            <legend className="mb-2 text-label font-semibold text-muted">Scarf colour</legend>
            <div className="flex gap-3">
              {(Object.keys(SCARF_HEX) as Scarf[]).map((s) => (
                <button key={s} type="button" aria-label={s} aria-pressed={v.scarf === s} onClick={() => set('scarf', s)} className="h-11 w-11 rounded-full border-2" style={{ background: SCARF_HEX[s], borderColor: v.scarf === s ? '#0E2A1B' : 'transparent', outline: v.scarf === s ? '2px solid #fff' : 'none', outlineOffset: -4 }} />
              ))}
            </div>
          </fieldset>
        </>)}
        {step === 1 && (<>
          <h1 className="text-[28px] leading-[34px]">Pick up to 5 interests</h1>
          <p className="inline-flex rounded-full bg-lemon px-3 py-1.5 text-label font-bold">{v.interests.length} of 5</p>
          <div className="flex flex-wrap gap-2.5">
            {INTERESTS.map((i) => {
              const on = v.interests.includes(i);
              return <Chip key={i} selected={on} disabled={!on && v.interests.length >= 5} onClick={() => set('interests', on ? v.interests.filter((x) => x !== i) : [...v.interests, i])}>{i}</Chip>;
            })}
          </div>
        </>)}
        {step === 2 && (<>
          <h1 className="text-[28px] leading-[34px]">Pick a favourite spot</h1>
          <CampusMap selected={v.spot} onSelect={(id) => set('spot', id)} label="Tap a spot to pick it" />
          <div className="rounded-card border-[1.5px] border-line bg-surface p-4">
            <p className="font-display text-heading font-bold">{getSpot(v.spot)?.name ?? 'Tap a spot on the map'}</p>
            <p className="text-label text-muted">Shown as a vibe clue only. Faculty buildings are pass-through, so they can&apos;t be picked.</p>
          </div>
        </>)}
        {step === 3 && (<>
          <h1 className="text-[28px] leading-[34px]">Add a conversation starter</h1>
          <p className="text-muted">Optional. It helps people say more than &quot;hi&quot;.</p>
          <Field label="My go-to jollof take…" hint={`${(v.starter ?? '').length} of 120 characters`}>
            <textarea value={v.starter ?? ''} maxLength={120} rows={3} onChange={(e) => set('starter', e.target.value)} className={`${inputCls()} py-3`} />
          </Field>
        </>)}
        {error && <Notice tone="err" title="That didn't save">{error}</Notice>}
      </div>
      <div className="space-y-2 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <Button className="w-full" disabled={!valid || pending} onClick={next}>{pending ? 'Saving…' : last ? (mode === 'edit' ? 'Save' : 'Finish and see home') : 'Continue'}</Button>
        {step === 3 && <Button variant="ghost" className="w-full" disabled={pending} onClick={() => { set('starter', ''); next(); }}>Skip for now</Button>}
      </div>
    </div>
  );
}
