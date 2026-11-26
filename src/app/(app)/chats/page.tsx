import { getChats, getFriendProfilePreview, getNotifications } from '@/lib/data';
import { Empty, Header, LinkButton } from '@/components/ui';
import { ChatsListClient } from '@/components/ChatsListClient';
import { PullToRefresh } from '@/components/PullToRefresh';
import type { ProfilePreviewData } from '@/components/ProfilePreviewModal';

export default async function Chats() {
  const [chats, notes] = await Promise.all([getChats(), getNotifications()]);
  const previewEntries = await Promise.all(
    chats.map(async (c) => [c.other_id, await getFriendProfilePreview(c.other_id)] as const)
  );
  const previews: Record<string, ProfilePreviewData> = {};
  for (const [id, data] of previewEntries) {
    if (data) previews[id] = data;
  }

  const unreadByChat: Record<string, number> = {};
  for (const n of notes) {
    if (n.kind === 'new_message' && !n.read_at && n.data.chat_id) {
      unreadByChat[n.data.chat_id] = (unreadByChat[n.data.chat_id] ?? 0) + 1;
    }
  }

  return (
    <PullToRefresh>
      <main className="min-h-[calc(100dvh-88px)] bg-bg">
        <Header title="Chats" />
        {chats.length === 0 ? (
          <Empty pose="wave" title="No chats yet" action={<LinkButton href="/home" className="w-full">Check the tree</LinkButton>}>When someone accepts your paper, or you accept one from the tree, the chat starts here.</Empty>
        ) : (
          <ChatsListClient chats={chats} previews={previews} unreadByChat={unreadByChat} />
        )}
      </main>
    </PullToRefresh>
  );
}
