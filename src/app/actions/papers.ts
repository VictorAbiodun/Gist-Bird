'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { papersLeft } from '@/lib/data';
import { friendlyError, errorCode } from '@/lib/errors';
import { hasContactInfo } from '@/lib/contentFilter';
import { MAX_PAPER, MIN_PAPER } from '@/lib/copy';

const sendSchema = z.object({ body: z.string().trim().min(MIN_PAPER).max(MAX_PAPER), origin: z.string().min(1) });

export async function sendPaper(input: { body: string; origin: string }): Promise<{ id?: string; error?: string; code?: string | null }> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { error: friendlyError(input.body.trim().length < MIN_PAPER ? 'too_short' : 'too_long') };
  if (hasContactInfo(parsed.data.body)) return { error: friendlyError('contact_info'), code: 'contact_info' };
  const left = await papersLeft();
  if (left <= 0) return { error: friendlyError('no_papers_left'), code: 'no_papers_left' };
  const { data, error } = await createClient().rpc('send_paper', { p_body: parsed.data.body, p_origin: parsed.data.origin });
  if (error) return { error: friendlyError(error), code: errorCode(error) };
  revalidatePath('/sent'); revalidatePath('/home'); revalidatePath('/write');
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

  let finalChatId = data as string;

  // Merge into existing chat if these two users already have a conversation
  try {
    const admin = createAdminClient();
    const { data: newChat } = await admin
      .from('chats')
      .select('id, user_a, user_b')
      .eq('id', finalChatId)
      .maybeSingle();

    if (newChat) {
      const { data: existingChats } = await admin
        .from('chats')
        .select('id, created_at')
        .or(
          `and(user_a.eq.${newChat.user_a},user_b.eq.${newChat.user_b}),and(user_a.eq.${newChat.user_b},user_b.eq.${newChat.user_a})`
        )
        .order('created_at', { ascending: true });

      const primary = existingChats?.[0];
      if (primary && primary.id !== newChat.id) {
        // Carry the newly accepted paper's message into their unified chat thread
        const { data: paper } = await admin
          .from('papers')
          .select('author_id, body')
          .eq('id', id)
          .maybeSingle();

        if (paper?.body && paper?.author_id) {
          await admin.from('messages').insert({
            chat_id: primary.id,
            sender_id: paper.author_id,
            body: `💌 ${paper.body}`,
          });
        }

        await admin.from('messages').update({ chat_id: primary.id }).eq('chat_id', newChat.id);
        await admin.from('chats').delete().eq('id', newChat.id);
        finalChatId = primary.id;
      }
    }
  } catch (mergeErr) {
    console.warn('Chat merge check skipped:', mergeErr);
  }

  revalidatePath('/home'); revalidatePath('/chats');
  return { chatId: finalChatId };
}
