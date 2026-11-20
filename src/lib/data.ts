import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ChatRow, ChatView, InboxItem, Notice, PaperView, Profile, SentItem } from '@/lib/types';

async function rpc<T>(name: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  const { data, error } = await createClient().rpc(name, args);
  if (error) { if (fallback !== undefined) return fallback; throw new Error(error.message); }
  return (data ?? fallback) as T;
}

export const getInbox = () => rpc<InboxItem[]>('get_inbox', undefined, []);
export const getSent = () => rpc<SentItem[]>('get_sent', undefined, []);
export const getPaper = (id: string) => rpc<PaperView | null>('get_paper', { p_id: id }, null);
export const getChats = () => rpc<ChatRow[]>('get_chats', undefined, []);
export const getChat = (id: string) => rpc<ChatView | null>('get_chat', { p_id: id }, null);
export const getNotifications = () => rpc<Notice[]>('get_notifications', undefined, []);
export const getBlocks = () => rpc<{ id: string; name: string; scarf: Profile['scarf'] }[]>('get_blocks', undefined, []);
export const papersLeft = () => rpc<number>('papers_left', undefined, 0);

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles')
    .select('id, display_name, name_mode, scarf, interests, favourite_spot, starter_prompt, status, paused_until')
    .eq('id', user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}
