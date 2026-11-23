'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/errors';

const reportSchema = z.object({
  reason: z.enum(['money', 'contact', 'rude', 'uncomfortable', 'other']),
  details: z.string().max(500).optional(),
  paperId: z.string().uuid().nullable().optional(),
  chatId: z.string().uuid().nullable().optional(),
  block: z.boolean(),
});

export async function reportUser(input: z.infer<typeof reportSchema>): Promise<{ error?: string }> {
  const p = reportSchema.safeParse(input);
  if (!p.success) return { error: 'Pick what happened.' };
  const v = p.data;
  if (!v.paperId && !v.chatId) return { error: 'We could not tell who this is about.' };
  const { error } = await createClient().rpc('report_user', {
    p_reason: v.reason, p_details: v.details ?? null,
    p_paper: v.paperId ?? null, p_chat: v.chatId ?? null, p_block: v.block,
  });
  revalidatePath('/chats'); revalidatePath('/home');
  return error ? { error: friendlyError(error) } : {};
}

export async function unblockUser(userId: string) {
  await createClient().rpc('unblock_user', { p_user: userId });
  revalidatePath('/settings/blocked');
}
