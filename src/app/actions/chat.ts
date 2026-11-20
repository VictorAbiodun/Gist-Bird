'use server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { friendlyError, errorCode } from '@/lib/errors';

const schema = z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(1000) });

export async function sendMessage(input: { chatId: string; body: string }): Promise<{ error?: string; code?: string | null }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: 'Write something first.' };
  const { error } = await createClient().rpc('send_message', { p_chat: parsed.data.chatId, p_body: parsed.data.body });
  return error ? { error: friendlyError(error), code: errorCode(error) } : {};
}
