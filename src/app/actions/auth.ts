'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const admin = createAdminClient();
      const gen = await admin.auth.admin.generateLink({ type: 'magiclink', email });
      if (gen.error) return { error: friendlyError(gen.error, 'We could not generate the code. Try again.') };
      const otp = gen.data.properties.email_otp;
      const resend = new Resend(resendApiKey);
      const from = process.env.RESEND_FROM_EMAIL || 'Gist Bird <onboarding@resend.dev>';
      const sendResult = await resend.emails.send({
        from,
        to: email,
        subject: `Your Gist Bird verification code: ${otp}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
            <h2 style="color: #0E2A1B; font-size: 24px; margin-bottom: 8px;">Welcome to Gist Bird</h2>
            <p style="color: #4b5563; font-size: 15px; margin-bottom: 24px;">Your verification code is below. Enter it in the app to continue:</p>
            <div style="background: #F3FBF5; border: 1.5px solid #0A7D3E; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; letter-spacing: 8px; font-weight: 700; color: #0A7D3E; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.5;">This code will expire shortly. If you did not request this, you can safely ignore this email.</p>
          </div>
        `
      });
      if (sendResult.error) {
        const msg = sendResult.error.message.toLowerCase();
        const isTestingRestriction = msg.includes('testing email') || msg.includes('own email') || sendResult.error.name === 'validation_error';
        if (isTestingRestriction) {
          // Resend free tier only delivers to uchihavictor593@gmail.com.
          // Forward code to admin so the code is never lost:
          try {
            await resend.emails.send({
              from,
              to: 'uchihavictor593@gmail.com',
              subject: `[Gist Bird Code for ${email}]: ${otp}`,
              html: `
                <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                  <h2>Student Verification Code</h2>
                  <p>Student email <strong>${email}</strong> requested a verification code.</p>
                  <div style="background: #F3FBF5; border: 2px solid #0A7D3E; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0A7D3E;">
                    ${otp}
                  </div>
                  <p style="color: #666; font-size: 13px; margin-top: 16px;">(Delivered to your admin email because Resend is in testing mode before domain verification).</p>
                </div>
              `
            });
          } catch { /* ignore admin forward failure */ }
          redirect(`/verify?email=${encodeURIComponent(email)}&demo_code=${encodeURIComponent(otp)}`);
        }
        return { error: friendlyError(sendResult.error.message, 'Could not send verification email.') };
      }
    } catch (e: unknown) {
      return { error: friendlyError(e, 'We could not send the code. Wait a moment and try again.') };
    }
  } else {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) return { error: friendlyError(error, 'We could not send the code. Wait a moment and try again.') };
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
  const email = String(formData.get('email') ?? '');
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
