import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { FINITE_ECONOMY_CUTOFF, getLagosDateString, INITIAL_FREE_PAPERS, type RewardStatus } from '@/lib/rewards';
import type { ChatRow, ChatView, InboxItem, Notice, PaperView, Profile, SentItem, MessageReactionsMap } from '@/lib/types';

async function rpc<T>(name: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  const { data, error } = await createClient().rpc(name, args);
  if (error) { if (fallback !== undefined) return fallback; throw new Error(error.message); }
  return (data ?? fallback) as T;
}

export const getInbox = async (): Promise<InboxItem[]> => {
  const items = await rpc<InboxItem[]>('get_inbox', undefined, []);
  if (!items || items.length === 0) return items ?? [];

  try {
    const admin = createAdminClient();
    const paperIds = items.map((i) => i.id);
    const { data: papersData } = await admin
      .from('papers')
      .select('id, author_id')
      .in('id', paperIds);

    if (papersData && papersData.length > 0) {
      const authorIds = Array.from(new Set(papersData.map((p) => p.author_id)));
      const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const uniMap = new Map<string, string>();
      for (const u of usersData?.users || []) {
        if (authorIds.includes(u.id) && u.user_metadata?.university) {
          uniMap.set(u.id, String(u.user_metadata.university));
        }
      }
      const paperAuthorMap = new Map(papersData.map((p) => [p.id, p.author_id]));
      return items.map((item) => {
        const authorId = paperAuthorMap.get(item.id);
        const uni = authorId ? uniMap.get(authorId) : undefined;
        return {
          ...item,
          from_university: uni,
        };
      });
    }
  } catch (err) {
    console.warn('Could not enrich inbox with universities:', err);
  }

  return items;
};

export async function getChatReadReceipt(chatId: string, otherId: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('notifications')
      .select('read_at')
      .eq('user_id', otherId)
      .eq('kind', 'new_message')
      .filter('data->>chat_id', 'eq', chatId)
      .not('read_at', 'is', null)
      .order('read_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.read_at ?? null;
  } catch (err) {
    console.warn('Failed to fetch chat read receipt:', err);
    return null;
  }
}

export async function getMessageReactions(chatId: string): Promise<MessageReactionsMap> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('notifications')
      .select('user_id, data')
      .eq('kind', 'message_reaction')
      .filter('data->>chat_id', 'eq', chatId);

    const map: MessageReactionsMap = {};
    for (const row of data || []) {
      const d = row.data as Record<string, unknown> | undefined;
      const msgId = Number(d?.message_id);
      const emoji = typeof d?.emoji === 'string' ? d.emoji : '';
      const userId = typeof row.user_id === 'string' ? row.user_id : '';
      if (!msgId || !emoji || !userId) continue;

      if (!map[msgId]) map[msgId] = [];
      const existing = map[msgId].find((r) => r.emoji === emoji);
      if (existing) {
        if (!existing.users.includes(userId)) existing.users.push(userId);
      } else {
        map[msgId].push({ emoji, users: [userId] });
      }
    }
    return map;
  } catch (err) {
    console.warn('Failed to fetch reactions:', err);
    return {};
  }
}


export const getSent = () => rpc<SentItem[]>('get_sent', undefined, []);
export const getPaper = (id: string) => rpc<PaperView | null>('get_paper', { p_id: id }, null);
export const getChats = async (): Promise<ChatRow[]> => {
  const rows = await rpc<ChatRow[]>('get_chats', undefined, []);
  const seen = new Set<string>();
  return rows.filter((c) => {
    if (seen.has(c.other_id)) return false;
    seen.add(c.other_id);
    return true;
  });
};
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
    admin
      .from('papers')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', user.id)
      .gte('sent_at', FINITE_ECONOMY_CUTOFF),
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
  if (!data) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    ...(data as Profile),
    user_tag: typeof meta.user_tag === 'string' ? meta.user_tag : undefined,
    university: typeof meta.university === 'string' ? meta.university : undefined,
    country: typeof meta.country === 'string' ? meta.country : undefined,
    age: typeof meta.age === 'string' ? meta.age : undefined,
    gender: typeof meta.gender === 'string' ? meta.gender : undefined,
    photo_url: typeof meta.photo_url === 'string' ? meta.photo_url : undefined,
  };
}
