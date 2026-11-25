import { notFound } from 'next/navigation';
import { getChat, getChatReadReceipt, getFriendProfilePreview, getMessageReactions, getMessageReplies } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { ChatThread } from '@/components/ChatThread';
import type { Message } from '@/lib/types';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const chat = await getChat(params.id);
  if (!chat) notFound();
  const [{ data }, otherLastReadAt, reactions, replies, otherProfilePreview] = await Promise.all([
    createClient().from('messages').select('*').eq('chat_id', chat.id).order('id').limit(300),
    getChatReadReceipt(chat.id, chat.other_id),
    getMessageReactions(chat.id),
    getMessageReplies(chat.id),
    getFriendProfilePreview(chat.other_id),
  ]);

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <ChatThread
        chatId={chat.id}
        me={chat.me}
        initial={(data ?? []) as Message[]}
        otherStarter={chat.other_starter}
        otherName={chat.other_name}
        otherScarf={chat.other_scarf}
        otherAvatar={chat.other_avatar}
        paperBody={chat.paper_body}
        blocked={chat.blocked}
        initialOtherLastReadAt={otherLastReadAt}
        initialReactions={reactions}
        initialReplies={replies}
        otherProfilePreview={otherProfilePreview}
      />
    </main>
  );
}
