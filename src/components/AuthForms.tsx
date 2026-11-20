'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { requestCode, verifyCode, type FormState } from '@/app/actions/auth';
import { Button, Field, inputCls, Notice } from './ui';

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending} className="w-full">{pending ? 'One moment…' : children}</Button>;
}
const initial: FormState = {};

export function EmailForm() {
  const [state, action] = useFormState(requestCode, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="School email" error={state.error} hint={state.error ? undefined : 'Use the address your school gave you.'}>
        <input name="email" type="email" inputMode="email" autoComplete="email" required placeholder="yourname@school.edu.ng" className={`${inputCls(!!state.error)} h-[52px]`} aria-invalid={!!state.error} />
      </Field>
      <Submit>Send code</Submit>
    </form>
  );
}

export function VerifyForm({ email }: { email: string }) {
  const [state, action] = useFormState(verifyCode, initial);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="email" value={email} />
      <Field label="6-digit code" error={state.error}>
        <input name="token" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required placeholder="000000" className={`${inputCls(!!state.error)} h-[60px] text-center font-display text-title tracking-[0.5em]`} aria-invalid={!!state.error} />
      </Field>
      {state.error && <Notice tone="err" title="That code didn't work">It may have expired. Try again, or go back and ask for a new one.</Notice>}
      <Submit>Verify</Submit>
    </form>
  );
}
