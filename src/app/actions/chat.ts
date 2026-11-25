'use server';

import { z } from 'zod';
import * as webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { VAPID_PUBLIC_KEY } from '@/lib/push';
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

  // Dispatch rich real-time notification + Web Push to recipient's phones
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

        // Send Web Push to all subscribed devices of the recipient (works when phone is locked/app closed)
        const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
        if (vapidPrivate) {
          webpush.setVapidDetails('mailto:support@gistbird.app', VAPID_PUBLIC_KEY, vapidPrivate);
          const { data: recipientAuth } = await admin.auth.admin.getUserById(recipientId);
          const subs = Array.isArray(recipientAuth?.user?.user_metadata?.push_subscriptions)
            ? (recipientAuth.user.user_metadata.push_subscriptions as webpush.PushSubscription[])
            : [];

          if (subs.length > 0) {
            const payload = JSON.stringify({
              title: senderName,
              body: messageText,
              icon: '/icons/icon.svg',
              url: `/chat/${parsed.data.chatId}`,
              tag: `chat-${parsed.data.chatId}`,
            });
            await Promise.allSettled(subs.map((sub) => webpush.sendNotification(sub, payload)));
          }
        }
      }
    }
  } catch (err) {
    console.warn('Realtime/WebPush notification dispatch failed:', err);
  }

  return {};
}
