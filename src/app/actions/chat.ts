'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { friendlyError, errorCode } from '@/lib/errors';

const schema = z.object({ chatId: z.string().uuid(), body: z.string().trim().min(1).max(1000) });

export async function sendMessage(input: {
  chatId: string;
  body: string;
}): Promise<{ error?: string; code?: string | null }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: 'Write something first.' };

  const client = createClient();
  const { error } = await client.rpc('send_message', {
    p_chat: parsed.data.chatId,
    p_body: parsed.data.body,
  });

  if (error) return { error: friendlyError(error), code: errorCode(error) };

  // Dispatch rich real-time notification with sender's name and message body
  try {
    const admin = createAdminClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (user) {
      const { data: chat } = await admin
        .from('chats')
        .select('user_a, user_b')
        .eq('id', parsed.data.chatId)
        .maybeSingle();

      if (chat) {
        const recipientId = chat.user_a === user.id ? chat.user_b : chat.user_a;
        const { data: profile } = await admin
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();

        const senderName = profile?.display_name?.trim() || 'Campus friend';
        const messageText = parsed.data.body;

        await admin.from('notifications').insert({
          user_id: recipientId,
          kind: 'new_message',
          title: senderName,
          body: messageText,
          data: {
            chat_id: parsed.data.chatId,
            sender_name: senderName,
            body: messageText,
          },
        });
      }
    }
  } catch (err) {
    console.warn('Realtime push notification payload dispatch failed:', err);
  }

  return {};
}
