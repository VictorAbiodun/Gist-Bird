'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Button, Chip, inputCls, Notice } from './ui';
import { Icon } from './Icon';
import { CampusMap } from './CampusMap';
import { UniversityLogo } from './UniversityLogo';
import { DateOfBirthWheelPicker, ScrollWheelPicker } from './ScrollWheelPicker';
import { ProfilePreviewModal } from './ProfilePreviewModal';
import { AVATAR_LIST } from '@/lib/assets';
import { INTERESTS } from '@/lib/copy';
import { getSpot } from '@/lib/campus';
import { NIGERIAN_UNIVERSITIES } from '@/lib/universities';
import { SCARF_HEX, type Profile, type Scarf } from '@/lib/types';
import { saveProfile, type ProfileInput } from '@/app/actions/profile';

type EditField =
  | 'avatar'
  | 'username'
  | 'userTag'
  | 'bio'
  | 'interests'
  | 'university'
  | 'country'
  | 'age'
  | 'gender'
  | 'spot'
  | 'birdName'
  | null;

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export function EditProfileView({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const [savedToast, setSavedToast] = useState(false);
  const [activeField, setActiveField] = useState<EditField>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uniQuery, setUniQuery] = useState('');

  const uniOptions = useMemo(() => {
    const q = uniQuery.trim().toLowerCase();
    const list = q
      ? NIGERIAN_UNIVERSITIES.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.shortName.toLowerCase().includes(q)
        )
      : NIGERIAN_UNIVERSITIES;
    return list.map((u) => ({
      value: u.name,
      label: u.name,
      sublabel: u.shortName,
      icon: <UniversityLogo university={u} size={20} />,
    }));
  }, [uniQuery]);

  const defaultTag =
    profile.user_tag ||
    profile.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '') ||
    'bird';

  const [form, setForm] = useState<ProfileInput>({
    displayName: profile.display_name,
    nameMode: profile.name_mode,
    scarf: profile.scarf,
    avatar: profile.avatar ?? '/avatars/avatar-01.svg',
    birdName: profile.bird_name ?? 'Chief Coo',
    interests: profile.interests ?? [],
    spot: profile.favourite_spot ?? 'gate',
    starter: profile.starter_prompt ?? '',
    userTag: defaultTag,
    university: profile.university ?? '',
    country: profile.country ?? 'Nigeria',
    age: profile.age ?? '',
    gender: profile.gender ?? '',
    photoUrl: profile.photo_url ?? '',
  });

  // Draft copy when editing inside modal
  const [draft, setDraft] = useState<ProfileInput>(form);

  const openEditor = (field: EditField) => {
    setError(undefined);
    setDraft(form);
    setActiveField(field);
  };

  const commitSave = (nextData: ProfileInput) => {
    setError(undefined);
    start(async () => {
      const payload: ProfileInput = {
        ...nextData,
        starter: nextData.starter?.trim() || null,
      };
      const res = await saveProfile(payload);
      if (res.error) {
        setError(res.error);
        return;
      }
      setForm(nextData);
      setActiveField(null);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2000);
      router.refresh();
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        commitSave({ ...form, photoUrl: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const spotName = getSpot(form.spot)?.name ?? 'Not set';

  return (
    <main className="min-h-dvh bg-[#F4F8FB] pb-10">
      {/* ── Top Header Bar ── */}
      <header className="flex items-center justify-between px-4 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <Link
          href="/me"
          aria-label="Back to profile"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition active:bg-black/5"
        >
          <Icon name="back" size={24} />
        </Link>

        <h1 className="font-display text-[19px] font-bold text-ink">My Profile</h1>

        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#DCECF9] px-3.5 py-1.5 text-[13px] font-bold text-[#1A5A8A] transition active:scale-95"
        >
          <span>Preview</span>
          <Icon name="eye" size={16} />
        </button>
      </header>

      {savedToast && (
        <div className="mx-5 mb-3 rounded-full bg-primary px-4 py-2 text-center text-[13px] font-bold text-white shadow-sm">
          Profile updated
        </div>
      )}

      {/* ── Avatar & Photo Picker ── */}
      <div className="flex items-start justify-center gap-7 px-5 py-4">
        {/* Avatar Option */}
        <button
          type="button"
          onClick={() => openEditor('avatar')}
          className="flex flex-col items-center gap-2 transition active:scale-95"
        >
          <div
            className={`flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-[18px] bg-[#E8EFF5] p-1.5 ${
              !form.photoUrl ? 'ring-2 ring-[#42B0E6]' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.avatar || '/avatars/avatar-01.svg'}
              alt="Avatar"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-[14px] font-semibold text-ink">Avatar</span>
        </button>

        {/* Photo Option */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 transition active:scale-95"
        >
          <div
            className={`flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface ${
              form.photoUrl ? 'ring-2 ring-[#42B0E6]' : ''
            }`}
          >
            {form.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.photoUrl} alt="Photo" className="h-full w-full object-cover" />
            ) : (
              <Avatar name={form.displayName} scarf={form.scarf} size={80} />
            )}
          </div>
          <span className="text-[14px] font-semibold text-ink">Photo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>

      {/* ── Rounded White Profile Fields Card ── */}
      <div className="px-4">
        <div className="divide-y divide-[#EEF2F6] overflow-hidden rounded-[22px] bg-surface shadow-[0_2px_12px_rgba(15,35,52,0.05)]">
          {/* Username */}
          <ProfileRow
            label="Username"
            value={form.displayName}
            onClick={() => openEditor('username')}
          />

          {/* User Tag */}
          <ProfileRow
            label="User Tag"
            value={`@${form.userTag || defaultTag}`}
            onClick={() => openEditor('userTag')}
          />

          {/* Bio */}
          <ProfileRow
            label="Bio"
            value={form.starter || 'Add a short bio or starter…'}
            muted={!form.starter}
            onClick={() => openEditor('bio')}
          />

          {/* Topics of interest */}
          <button
            type="button"
            onClick={() => openEditor('interests')}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition active:bg-surface-alt/50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold text-ink">Topics of interest</p>
              <p className="mt-1 truncate text-[13px] italic text-muted">
                {form.interests.length > 0
                  ? form.interests.join(', ')
                  : 'Pick up to 5 topics…'}
              </p>
            </div>
            <Icon name="chev" size={18} className="shrink-0 text-muted" />
          </button>

          {/* University name (replacing Languages spoken) */}
          <button
            type="button"
            onClick={() => openEditor('university')}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition active:bg-surface-alt/50"
          >
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold text-ink">University name</p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] italic text-muted">
                {form.university && <UniversityLogo university={form.university} size={16} />}
                <span className="truncate">{form.university || 'Add your university…'}</span>
              </p>
            </div>
            <Icon name="chev" size={18} className="shrink-0 text-muted" />
          </button>

          {/* Country */}
          <ProfileRow
            label="Country"
            value={form.country || 'Nigeria'}
            onClick={() => openEditor('country')}
          />

          {/* Age */}
          <ProfileRow
            label="Age"
            value={form.age || 'Add age'}
            muted={!form.age}
            onClick={() => openEditor('age')}
          />

          {/* Gender */}
          <ProfileRow
            label="Gender"
            value={form.gender || 'Select'}
            muted={!form.gender}
            onClick={() => openEditor('gender')}
          />

          {/* Favourite Campus Spot */}
          <ProfileRow
            label="Favourite spot"
            value={spotName}
            onClick={() => openEditor('spot')}
          />

          {/* Bird Name */}
          <ProfileRow
            label="Bird name"
            value={form.birdName || 'Chief Coo'}
            onClick={() => openEditor('birdName')}
          />
        </div>
      </div>

      {/* ── Field Edit Modal Sheet ── */}
      {activeField && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          onClick={() => !pending && setActiveField(null)}
        >
          <div
            className="w-full max-w-[460px] rounded-t-[26px] bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[26px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-[18px] font-bold text-ink">
                {activeField === 'avatar' && 'Choose Avatar & Scarf'}
                {activeField === 'username' && 'Edit Username'}
                {activeField === 'userTag' && 'Edit User Tag'}
                {activeField === 'bio' && 'Edit Bio'}
                {activeField === 'interests' && 'Topics of Interest'}
                {activeField === 'university' && 'University Name'}
                {activeField === 'country' && 'Country'}
                {activeField === 'age' && 'Age'}
                {activeField === 'gender' && 'Gender'}
                {activeField === 'spot' && 'Favourite Campus Spot'}
                {activeField === 'birdName' && 'Bird Name'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveField(null)}
                className="text-label font-bold text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3">
                <Notice tone="err" title="Could not save">{error}</Notice>
              </div>
            )}

            {activeField === 'avatar' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2.5">
                  {AVATAR_LIST.map((av) => {
                    const selected = draft.avatar === av.file && !draft.photoUrl;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, avatar: av.file, photoUrl: '' }))}
                        className={`flex aspect-square items-center justify-center rounded-2xl border-2 p-2 transition ${
                          selected
                            ? 'border-primary bg-surface-alt'
                            : 'border-line bg-bg'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={av.file} alt={av.name} className="h-full w-full object-contain" />
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label font-semibold text-muted">Scarf colour</span>
                  <div className="flex gap-2">
                    {(Object.keys(SCARF_HEX) as Scarf[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, scarf: s }))}
                        aria-label={`Scarf ${s}`}
                        className={`h-8 w-8 rounded-full border-2 ${
                          draft.scarf === s ? 'border-ink scale-110' : 'border-transparent'
                        }`}
                        style={{ background: SCARF_HEX[s] }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeField === 'username' && (
              <input
                value={draft.displayName}
                onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
                maxLength={24}
                placeholder="Your display name"
                className={`${inputCls()} h-[50px]`}
              />
            )}

            {activeField === 'userTag' && (
              <input
                value={draft.userTag ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, userTag: e.target.value.replace(/^@+/, '') }))}
                maxLength={30}
                placeholder="e.g. Eli3112"
                className={`${inputCls()} h-[50px]`}
              />
            )}

            {activeField === 'bio' && (
              <textarea
                value={draft.starter ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, starter: e.target.value }))}
                maxLength={120}
                rows={3}
                placeholder="Write a short bio or conversation starter…"
                className={`${inputCls()} py-3`}
              />
            )}

            {activeField === 'interests' && (
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((topic) => {
                  const selected = draft.interests.includes(topic);
                  return (
                    <Chip
                      key={topic}
                      selected={selected}
                      onClick={() => {
                        setDraft((d) => {
                          if (selected) {
                            return { ...d, interests: d.interests.filter((x) => x !== topic) };
                          }
                          if (d.interests.length >= 5) return d;
                          return { ...d, interests: [...d.interests, topic] };
                        });
                      }}
                    >
                      {topic}
                    </Chip>
                  );
                })}
              </div>
            )}

            {activeField === 'university' && (
              <div className="space-y-3">
                <input
                  value={uniQuery}
                  onChange={(e) => setUniQuery(e.target.value)}
                  placeholder="Search Nigerian university…"
                  className={`${inputCls()} h-[44px] text-[14px]`}
                />
                {uniOptions.length > 0 ? (
                  <ScrollWheelPicker
                    options={uniOptions}
                    value={draft.university || uniOptions[0].value}
                    onChange={(val) => setDraft((d) => ({ ...d, university: val }))}
                    visibleCount={5}
                    itemHeight={48}
                  />
                ) : (
                  <p className="py-6 text-center text-label text-muted">
                    No matching university found.
                  </p>
                )}
              </div>
            )}

            {activeField === 'country' && (
              <input
                value={draft.country ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
                maxLength={50}
                placeholder="e.g. Nigeria"
                className={`${inputCls()} h-[50px]`}
              />
            )}

            {activeField === 'age' && (
              <DateOfBirthWheelPicker
                initialAgeStr={draft.age}
                onChange={(val) => setDraft((d) => ({ ...d, age: val }))}
              />
            )}

            {activeField === 'gender' && (
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, gender: g }))}
                    className={`rounded-btn border-[1.5px] py-3 text-label font-bold transition ${
                      draft.gender === g
                        ? 'border-primary bg-surface-alt text-primary'
                        : 'border-line bg-bg text-ink'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            {activeField === 'spot' && (
              <CampusMap
                selected={draft.spot}
                onSelect={(id) => setDraft((d) => ({ ...d, spot: id }))}
              />
            )}

            {activeField === 'birdName' && (
              <input
                value={draft.birdName ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, birdName: e.target.value }))}
                maxLength={24}
                placeholder="Chief Coo"
                className={`${inputCls()} h-[50px]`}
              />
            )}

            <div className="mt-5 flex gap-2.5">
              <Button
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setActiveField(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={pending}
                onClick={() => commitSave(draft)}
              >
                {pending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Preview Modal ── */}
      <ProfilePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={{
          displayName: form.displayName,
          userTag: form.userTag,
          avatar: form.avatar,
          photoUrl: form.photoUrl,
          scarf: form.scarf,
          university: form.university,
          country: form.country,
          age: form.age,
          gender: form.gender,
          bio: form.starter,
          interests: form.interests,
          spotName,
          isOwnProfile: false,
        }}
      />
    </main>
  );
}

function ProfileRow({
  label,
  value,
  muted = false,
  onClick,
}: {
  label: string;
  value: string;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition active:bg-surface-alt/50"
    >
      <span className="shrink-0 font-display text-[15px] font-bold text-ink">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-[14px] italic ${
            muted ? 'text-muted/70' : 'text-muted'
          }`}
        >
          {value}
        </span>
        <Icon name="chev" size={18} className="shrink-0 text-muted" />
      </span>
    </button>
  );
}
