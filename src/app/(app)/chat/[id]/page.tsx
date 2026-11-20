import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getChat } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { ChatThread } from '@/components/ChatThread';
import { Avatar, Header, Notice } from '@/components/ui';
import { Icon } from '@/components/Icon';
import type { Message } from '@/lib/types';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const chat = await getChat(params.id);
  if (!chat) notFound();
  const { data } = await createClient().from('messages').select('*').eq('chat_id', chat.id).order('id').limit(300);
  return (
    <main className="flex h-dvh flex-col">
      <Header back="/chats" right={<Link href={`/report?chat=${chat.id}`} aria-label="Report or block" className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface"><Icon name="flag" size={22} /></Link>} />
      <div className="flex items-center gap-3 px-5 pb-2"><Avatar name={chat.other_name} scarf={chat.other_scarf} /><h1 className="text-title">{chat.other_name}</h1></div>
      <div className="px-5 pb-1"><div className="rounded-input bg-surface-alt p-3"><p className="text-caption font-bold text-muted">YOUR PAPER</p><p className="line-clamp-2 text-label">{chat.paper_body}</p></div></div>
      {chat.blocked ? <div className="px-5 pt-4"><Notice title="You blocked this person">Unblock them in Settings to keep chatting.</Notice></div>
        : <ChatThread chatId={chat.id} me={chat.me} initial={(data ?? []) as Message[]} otherStarter={chat.other_starter} />}
    </main>
  );
}
