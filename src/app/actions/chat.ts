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
          .select('display_name, avatar')
          .eq('id', user.id)
          .maybeSingle();

        const senderName = profile?.display_name?.trim() || 'Campus friend';
        const senderAvatar = profile?.avatar || '/icons/icon.svg';
        const messageText = parsed.data.body;

        await admin.from('notifications').insert({
          user_id: recipientId,
          kind: 'new_message',
          title: senderName,
          body: messageText,
          data: {
            chat_id: parsed.data.chatId,
            sender_name: senderName,
            sender_avatar: senderAvatar,
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
              icon: senderAvatar.startsWith('/') ? senderAvatar : '/icons/icon.svg',
              badge: '/icons/paper.png',
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

export async function markChatRead(chatId: string): Promise<{ success: boolean }> {
  try {
    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { success: false };

    const admin = createAdminClient();
    await admin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('kind', 'new_message')
      .filter('data->>chat_id', 'eq', chatId)
      .is('read_at', null);

    return { success: true };
  } catch (err) {
    console.warn('markChatRead error:', err);
    return { success: false };
  }
}

export async function toggleMessageReaction(input: {
  chatId: string;
  messageId: number;
  emoji: string;
}): Promise<{ action: 'add' | 'remove'; error?: string }> {
  try {
    const client = createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { action: 'remove', error: 'Not signed in' };

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('notifications')
      .select('id, data')
      .eq('user_id', user.id)
      .eq('kind', 'message_reaction')
      .filter('data->>chat_id', 'eq', input.chatId)
      .filter('data->>message_id', 'eq', String(input.messageId));

    const sameEmoji = existing?.find((r) => {
      const d = r.data as Record<string, unknown> | undefined;
      return d?.emoji === input.emoji;
    });

    if (sameEmoji) {
      await admin.from('notifications').delete().eq('id', sameEmoji.id);
      return { action: 'remove' };
    } else {
      if (existing && existing.length > 0) {
        const priorIds = existing.map((r) => r.id);
        await admin.from('notifications').delete().in('id', priorIds);
      }
      await admin.from('notifications').insert({
        user_id: user.id,
        kind: 'message_reaction',
        title: input.emoji,
        data: {
          chat_id: input.chatId,
          message_id: input.messageId,
          emoji: input.emoji,
          user_id: user.id,
        },
      });
      return { action: 'add' };
    }
  } catch (err) {
    console.warn('toggleMessageReaction error:', err);
    return { action: 'remove', error: 'Failed to update reaction' };
  }
}


