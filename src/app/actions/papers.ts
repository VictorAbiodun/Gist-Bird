'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { friendlyError, errorCode } from '@/lib/errors';
import { hasContactInfo } from '@/lib/contentFilter';
import { MAX_PAPER, MIN_PAPER } from '@/lib/copy';

const sendSchema = z.object({ body: z.string().trim().min(MIN_PAPER).max(MAX_PAPER), origin: z.string().min(1) });

export async function sendPaper(input: { body: string; origin: string }): Promise<{ id?: string; error?: string; code?: string | null }> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: friendlyError(input.body.trim().length < MIN_PAPER ? 'too_short' : 'too_long') };
  if (hasContactInfo(parsed.data.body)) return { error: friendlyError('contact_info'), code: 'contact_info' };
  const { data, error } = await createClient().rpc('send_paper', { p_body: parsed.data.body, p_origin: parsed.data.origin });
  if (error) return { error: friendlyError(error), code: errorCode(error) };
  revalidatePath('/sent'); revalidatePath('/home');
  return { id: data as string };
}

export async function openPaper(id: string) {
  await createClient().rpc('open_paper', { p_id: id });
  revalidatePath('/home'); revalidatePath(`/paper/${id}`);
}

export async function passPaper(id: string): Promise<{ error?: string }> {
  const { error } = await createClient().rpc('pass_paper', { p_id: id });
  revalidatePath('/home');
  return error ? { error: friendlyError(error) } : {};
}

export async function acceptPaper(id: string): Promise<{ chatId?: string; error?: string }> {
  const { data, error } = await createClient().rpc('accept_paper', { p_id: id });
  if (error) return { error: friendlyError(error) };
  revalidatePath('/home'); revalidatePath('/chats');
  return { chatId: data as string };
}
