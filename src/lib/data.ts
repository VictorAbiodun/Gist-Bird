import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLagosDateString, INITIAL_FREE_PAPERS, type RewardStatus } from '@/lib/rewards';
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
export const getNotifications = async (): Promise<Notice[]> => {
  const list = await rpc<Notice[]>('get_notifications', undefined, []);
  return list.filter((n) => n.kind !== 'daily_reward_claimed');
};
export const getBlocks = () => rpc<{ id: string; name: string; scarf: Profile['scarf']; avatar?: string }[]>('get_blocks', undefined, []);

export async function getRewardStatus(): Promise<RewardStatus> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      papersLeft: 0,
      coins: 0,
      streak: 0,
      currentDay: 1,
      canClaimToday: false,
      todayClaimedDay: null,
      lastRewardDay: null,
    };
  }

  const admin = createAdminClient();
  const [{ count: sentCount }, { data: rewardRows }] = await Promise.all([
    admin.from('papers').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    admin
      .from('notifications')
      .select('data, created_at')
      .eq('user_id', user.id)
      .eq('kind', 'daily_reward_claimed')
      .order('created_at', { ascending: false }),
  ]);

  const rows = (rewardRows ?? []) as Array<{
    data?: {
      day?: number;
      streak?: number;
      reward_day?: string;
      papers_awarded?: number;
      coins_awarded?: number;
    };
  }>;

  let totalRewardPapers = 0;
  let totalRewardCoins = 0;
  for (const row of rows) {
    totalRewardPapers += Number(row.data?.papers_awarded ?? 0);
    totalRewardCoins += Number(row.data?.coins_awarded ?? 0);
  }

  const papersBalance = Math.max(0, INITIAL_FREE_PAPERS + totalRewardPapers - (sentCount ?? 0));

  const today = getLagosDateString();
  const yesterday = getLagosDateString(new Date(Date.now() - 86400000));

  const latest = rows[0]?.data;
  const lastRewardDay = latest?.reward_day ?? null;
  const lastStreak = Number(latest?.streak ?? 0);

  let streak = 0;
  let canClaimToday = true;
  let todayClaimedDay: number | null = null;
  let currentDay = 1;

  if (lastRewardDay === today) {
    canClaimToday = false;
    streak = Math.max(1, lastStreak);
    todayClaimedDay = Number(latest?.day ?? ((streak - 1) % 20) + 1);
    currentDay = todayClaimedDay;
  } else if (lastRewardDay === yesterday) {
    canClaimToday = true;
    streak = lastStreak;
    currentDay = (streak % 20) + 1;
  } else {
    canClaimToday = true;
    streak = 0;
    currentDay = 1;
  }

  return {
    papersLeft: papersBalance,
    coins: totalRewardCoins,
    streak,
    currentDay,
    canClaimToday,
    todayClaimedDay,
    lastRewardDay,
  };
}

export async function papersLeft(): Promise<number> {
  const status = await getRewardStatus();
  return status.papersLeft;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles')
    .select('id, display_name, name_mode, scarf, avatar, bird_name, interests, favourite_spot, starter_prompt, status, paused_until, created_at, papers_used')
    .eq('id', user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}
