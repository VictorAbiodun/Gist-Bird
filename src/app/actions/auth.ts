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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: friendlyError(error.message, 'We could not send the verification code. Please try again.') };
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

export async function loginWithPassword(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { error: 'Enter your school email address.' };
  const password = String(formData.get('password') ?? '');
  if (!password) return { error: 'Enter your password.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data,
    password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      return { error: 'Incorrect email or password. If you haven’t set a password yet, sign in with an email code.' };
    }
    return { error: friendlyError(error.message, 'Could not log in. Check your credentials and try again.') };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user!.id).maybeSingle();
  redirect(profile ? '/home' : '/onboarding');
}

export async function setPassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 6) return { error: 'Password must be at least 6 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: friendlyError(error.message, 'Could not update password.') };

  return { error: undefined };
}

export async function verifyCode(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const token = String(formData.get('token') ?? '').replace(/\D/g, '');
  if (token.length !== 6 && token.length !== 8) return { error: 'Enter the verification code from your email.' };
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
