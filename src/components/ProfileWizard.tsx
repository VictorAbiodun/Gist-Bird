'use client';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip, Field, inputCls, Notice, Header } from './ui';
import { CampusMap } from './CampusMap';
import { UniversityLogo } from './UniversityLogo';
import { DateOfBirthWheelPicker, ScrollWheelPicker } from './ScrollWheelPicker';
import { INTERESTS, randomAlias } from '@/lib/copy';
import { SCARF_HEX, type Scarf } from '@/lib/types';
import { getSpot } from '@/lib/campus';
import { NIGERIAN_UNIVERSITIES, formatAgeDob } from '@/lib/universities';
import { finishOnboarding, saveProfile, type ProfileInput } from '@/app/actions/profile';
import { AVATAR_LIST } from '@/lib/assets';
import { Icon } from './Icon';

const STEPS = ['name', 'university', 'dob', 'interests', 'spot', 'starter'] as const;
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export function ProfileWizard({ initial, mode = 'onboarding' }: { initial?: Partial<ProfileInput>; mode?: 'onboarding' | 'edit' }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [uniSearch, setUniSearch] = useState('');
  const [v, setV] = useState<ProfileInput>({
    displayName: initial?.displayName ?? '',
    nameMode: initial?.nameMode ?? 'real',
    scarf: initial?.scarf ?? 'green',
    avatar: initial?.avatar ?? '/avatars/avatar-01.svg',
    birdName: initial?.birdName ?? 'Chief Coo',
    interests: initial?.interests ?? [],
    spot: initial?.spot ?? null,
    starter: initial?.starter ?? '',
    university: initial?.university ?? NIGERIAN_UNIVERSITIES[0].name,
    country: initial?.country ?? 'Nigeria',
    age: initial?.age ?? formatAgeDob(15, 6, 2005),
    gender: initial?.gender ?? 'Prefer not to say',
  });
  const set = <K extends keyof ProfileInput>(k: K, val: ProfileInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const uniOptions = useMemo(() => {
    const q = uniSearch.trim().toLowerCase();
    const list = q
      ? NIGERIAN_UNIVERSITIES.filter(
          (u) => u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q)
        )
      : NIGERIAN_UNIVERSITIES;
    return list.map((u) => ({
      value: u.name,
      label: u.name,
      sublabel: u.shortName,
      icon: <UniversityLogo university={u} size={20} />,
    }));
  }, [uniSearch]);

  const valid = [
    v.displayName.trim().length >= 2,
    Boolean(v.university && v.university.trim().length > 0),
    Boolean(v.age && v.age.trim().length > 0),
    true,
    !!v.spot,
    true,
  ][step];
  const last = step === STEPS.length - 1;

  function doSave() {
    setError(undefined);
    start(async () => {
      const payload = { ...v, starter: v.starter?.trim() || null };
      if (mode === 'onboarding') {
        const r = await finishOnboarding(payload);
        if (r?.error) setError(r.error);
      } else {
        const r = await saveProfile(payload);
        if (r.error) setError(r.error);
        else router.push('/me');
      }
    });
  }

  function next() {
    setError(undefined);
    if (!last) return setStep(step + 1);
    doSave();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        back={step > 0 ? undefined : mode === 'edit' ? '/me' : undefined}
        right={step > 0 ? <Button variant="ghost" className="min-h-[44px] px-3" onClick={() => setStep(step - 1)}>Back</Button> : undefined}
      />
      <div className="flex gap-1.5 px-5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />
        ))}
      </div>
      <div className="flex-1 space-y-4 px-5 pt-6">
        {step === 0 && (
          <>
            <h1 className="text-[28px] leading-[34px]">How should we show you?</h1>
            <p className="text-muted">Choose your avatar and name. You can change them any time.</p>

            {/* Avatar Picker */}
            <div className="space-y-3">
              <label className="block text-label font-semibold text-muted">Choose your avatar</label>
              <div className="flex items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.avatar || '/avatars/avatar-01.svg'}
                  alt="Selected avatar"
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-primary object-cover bg-surface-alt"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-body">
                    {AVATAR_LIST.find((a) => a.file === v.avatar)?.name ?? 'Selected Avatar'}
                  </p>
                  <p className="text-caption text-muted">Tap any bird avatar below</p>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-card border-[1.5px] border-line bg-surface p-2.5">
                <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-6">
                  {AVATAR_LIST.map((a) => {
                    const selected = (v.avatar || '/avatars/avatar-01.svg') === a.file;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        aria-label={a.name}
                        aria-pressed={selected}
                        onClick={() => set('avatar', a.file)}
                        className={`relative flex flex-col items-center justify-center rounded-xl p-1 transition-transform active:scale-95 ${
                          selected
                            ? 'bg-lemon/40 ring-2 ring-primary ring-offset-1'
                            : 'hover:bg-surface-alt'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.file}
                          alt={a.name}
                          width={44}
                          height={44}
                          className="h-11 w-11 rounded-full object-cover"
                          loading="lazy"
                        />
                        {selected && (
                          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white shadow">
                            <Icon name="check" size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2" role="group" aria-label="Name type">
              <Chip selected={v.nameMode === 'real'} onClick={() => set('nameMode', 'real')}>Real name</Chip>
              <Chip selected={v.nameMode === 'alias'} onClick={() => { set('nameMode', 'alias'); if (!v.displayName) set('displayName', randomAlias()); }}>Alias</Chip>
            </div>
            <Field label={v.nameMode === 'real' ? 'Your name' : 'Your alias'} hint="2 to 24 characters.">
              <input value={v.displayName} maxLength={24} onChange={(e) => set('displayName', e.target.value)} className={`${inputCls()} h-[52px]`} autoComplete={v.nameMode === 'real' ? 'given-name' : 'off'} />
            </Field>
            {v.nameMode === 'alias' && <Button variant="outline" icon="refresh" onClick={() => set('displayName', randomAlias())}>Try another alias</Button>}

            {/* Bird Naming */}
            <Field label="Your messenger bird's name" hint="Default: Chief Coo. Your bird carries your papers!">
              <div className="flex items-center gap-2">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lemon text-lg shadow-sm">
                  🕊️
                </span>
                <input
                  value={v.birdName || 'Chief Coo'}
                  maxLength={24}
                  onChange={(e) => set('birdName', e.target.value)}
                  placeholder="Chief Coo"
                  className={`${inputCls()} h-[52px] flex-1`}
                />
              </div>
            </Field>
            <fieldset>
              <legend className="mb-2 text-label font-semibold text-muted">Scarf colour</legend>
              <div className="flex gap-3">
                {(Object.keys(SCARF_HEX) as Scarf[]).map((s) => (
                  <button key={s} type="button" aria-label={s} aria-pressed={v.scarf === s} onClick={() => set('scarf', s)} className="h-11 w-11 rounded-full border-2" style={{ background: SCARF_HEX[s], borderColor: v.scarf === s ? '#0E2A1B' : 'transparent', outline: v.scarf === s ? '2px solid #fff' : 'none', outlineOffset: -4 }} />
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-[28px] leading-[34px]">Which university are you in?</h1>
            <p className="text-muted">Scroll through Nigerian universities or search to pick yours.</p>
            <input
              value={uniSearch}
              onChange={(e) => setUniSearch(e.target.value)}
              placeholder="Search university (e.g. Redeemer's, Covenant, UNILAG)…"
              className={`${inputCls()} h-[46px] text-[14px]`}
            />
            {uniOptions.length > 0 ? (
              <ScrollWheelPicker
                options={uniOptions}
                value={v.university || uniOptions[0].value}
                onChange={(val) => set('university', val)}
                visibleCount={5}
                itemHeight={48}
              />
            ) : (
              <Notice tone="info" title="No match">
                Try another search term or clear the search box.
              </Notice>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-[28px] leading-[34px]">When&apos;s your birthday?</h1>
            <p className="text-muted">Spin the wheels to set your date of birth and age.</p>
            <DateOfBirthWheelPicker
              initialAgeStr={v.age}
              onChange={(val) => set('age', val)}
            />
            <fieldset className="pt-2">
              <legend className="mb-2 text-label font-semibold text-muted">Gender</legend>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <Chip
                    key={g}
                    selected={v.gender === g}
                    onClick={() => set('gender', g)}
                  >
                    {g}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-[28px] leading-[34px]">Pick up to 5 interests</h1>
            <p className="inline-flex rounded-full bg-lemon px-3 py-1.5 text-label font-bold">{v.interests.length} of 5</p>
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map((i) => {
                const on = v.interests.includes(i);
                return <Chip key={i} selected={on} disabled={!on && v.interests.length >= 5} onClick={() => set('interests', on ? v.interests.filter((x) => x !== i) : [...v.interests, i])}>{i}</Chip>;
              })}
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="text-[28px] leading-[34px]">Pick a favourite spot</h1>
            <CampusMap selected={v.spot} onSelect={(id) => set('spot', id)} label="Tap a spot to pick it" />
            <div className="rounded-card border-[1.5px] border-line bg-surface p-4">
              <p className="font-display text-heading font-bold">{getSpot(v.spot)?.name ?? 'Tap a spot on the map'}</p>
              <p className="text-label text-muted">Shown as a vibe clue only. Faculty buildings are pass-through, so they can&apos;t be picked.</p>
            </div>
          </>
        )}
        {step === 5 && (
          <>
            <h1 className="text-[28px] leading-[34px]">Add a conversation starter</h1>
            <p className="text-muted">Optional. It helps people say more than &quot;hi&quot;.</p>
            <Field label="My go-to jollof take…" hint={`${(v.starter ?? '').length} of 120 characters`}>
              <textarea value={v.starter ?? ''} maxLength={120} rows={3} onChange={(e) => set('starter', e.target.value)} className={`${inputCls()} py-3`} />
            </Field>
          </>
        )}
        {error && <Notice tone="err" title="That didn't save">{error}</Notice>}
      </div>
      <div className="space-y-2 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        {mode === 'edit' && !last && (
          <Button className="w-full" disabled={!valid || pending} onClick={doSave}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        )}
        <Button
          variant={mode === 'edit' && !last ? 'outline' : 'primary'}
          className="w-full"
          disabled={!valid || pending}
          onClick={next}
        >
          {pending && (last || mode !== 'edit')
            ? 'Saving…'
            : last
            ? mode === 'edit'
              ? 'Save'
              : 'Finish and see home'
            : mode === 'edit'
            ? 'Next step'
            : 'Continue'}
        </Button>
        {last && <Button variant="ghost" className="w-full" disabled={pending} onClick={() => { set('starter', ''); next(); }}>Skip for now</Button>}
      </div>
    </div>
  );
}
