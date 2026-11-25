import { getChats, getFriendProfilePreview } from '@/lib/data';
import { Empty, Header, LinkButton } from '@/components/ui';
import { ChatsListClient } from '@/components/ChatsListClient';
import type { ProfilePreviewData } from '@/components/ProfilePreviewModal';

export default async function Chats() {
  const chats = await getChats();
  const previewEntries = await Promise.all(
    chats.map(async (c) => [c.other_id, await getFriendProfilePreview(c.other_id)] as const)
  );
  const previews: Record<string, ProfilePreviewData> = {};
  for (const [id, data] of previewEntries) {
    if (data) previews[id] = data;
  }

  return (
    <main>
      <Header title="Chats" />
      {chats.length === 0 ? (
        <Empty pose="wave" title="No chats yet" action={<LinkButton href="/home" className="w-full">Check the tree</LinkButton>}>When someone accepts your paper, or you accept one from the tree, the chat starts here.</Empty>
      ) : (
        <ChatsListClient chats={chats} previews={previews} />
      )}
    </main>
  );
}
