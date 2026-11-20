'use client';
import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { requestCode, verifyCode, loginWithPassword, setPassword, type FormState } from '@/app/actions/auth';
import { Button, Field, inputCls, Notice } from './ui';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full">{pending ? 'One moment…' : children}</Button>;
}
const initial: FormState = {};

export function LoginForm() {
  const [state, action] = useFormState(loginWithPassword, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="School email" error={state.error}>
        <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="yourname@school.edu.ng" className={`${inputCls(!!state.error)} h-[52px]`} aria-invalid={!!state.error} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" className={`${inputCls(!!state.error)} h-[52px]`} />
      </Field>
      {state.error && <Notice tone="err" title="Could not log in">{state.error}</Notice>}
      <Submit>Log in</Submit>
      <div className="flex flex-col gap-2 pt-2 text-center text-label">
        <Link href="/email" className="font-semibold text-primary underline">
          Log in with email code instead
        </Link>
      </div>
    </form>
  );
}

export function EmailForm() {
  const [state, action] = useFormState(requestCode, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="School email" error={state.error} hint={state.error ? undefined : 'Use the address your school gave you.'}>
        <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="yourname@school.edu.ng" className={`${inputCls(!!state.error)} h-[52px]`} aria-invalid={!!state.error} />
      </Field>
      <Submit>Send 6-digit code</Submit>
    </form>
  );
}

export function VerifyForm({ email, defaultToken = '' }: { email: string; defaultToken?: string }) {
  const [state, action] = useFormState(verifyCode, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <Field label="6-digit verification code" error={state.error} hint="Check your inbox for the code.">
        <input
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          defaultValue={defaultToken}
          required
          placeholder="123456"
          className={`${inputCls(!!state.error)} h-[60px] text-center font-display text-title tracking-[0.3em]`}
          aria-invalid={!!state.error}
        />
      </Field>
      {state.error && <Notice tone="err" title="That code didn't work">{state.error}</Notice>}
      <Submit>Verify</Submit>
    </form>
  );
}

export function SetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action] = useFormState(async (prev: FormState, formData: FormData) => {
    const res = await setPassword(prev, formData);
    if (!res.error && onSuccess) onSuccess();
    return res;
  }, initial);

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="New password" error={state.error} hint="At least 6 characters.">
        <input name="password" type="password" autoComplete="new-password" required minLength={6} placeholder="••••••••" className={`${inputCls(!!state.error)} h-[52px]`} />
      </Field>
      <Field label="Confirm password">
        <input name="confirm" type="password" autoComplete="new-password" required minLength={6} placeholder="••••••••" className={`${inputCls(!!state.error)} h-[52px]`} />
      </Field>
      {state.error && <Notice tone="err" title="Error">{state.error}</Notice>}
      {state.error === undefined && state !== initial && (
        <Notice tone="info" title="Success">Your password has been saved! You can now log in anytime without waiting for an OTP.</Notice>
      )}
      <Submit>Save password</Submit>
    </form>
  );
}
