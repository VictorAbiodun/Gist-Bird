'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { allowedDomains } from '@/lib/supabase/env';
import { friendlyError } from '@/lib/errors';

export interface FormState { error?: string }

const emailSchema = z.string().trim().toLowerCase().email();

export async function requestCode(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Enter your school email, like name@school.edu.ng.' };
  const email = parsed.data;
  const domains = allowedDomains();
  const emailDomain = email.split('@')[1];
  const isAllowed = !domains.length || domains.some((d) => emailDomain === d || emailDomain.endsWith('.' + d));
  if (!isAllowed) {
    return { error: "That doesn't look like a school email. Try the one your school gave you." };
  }
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { error: friendlyError(error, 'We could not send the code. Wait a moment and try again.') };
  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyCode(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '');
  const token = String(formData.get('token') ?? '').replace(/\D/g, '');
  if (token.length !== 6) return { error: 'Enter the 6-digit code from your email.' };
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { error: "That code didn't work. It may have expired. Try again, or ask for a new one." };
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user!.id).maybeSingle();
  redirect(profile ? '/home' : '/onboarding');
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect('/welcome');
}
