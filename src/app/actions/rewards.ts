'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getRewardStatus } from '@/lib/data';
import { getLagosDateString, REWARD_DAYS, type DailyRewardItem } from '@/lib/rewards';

export interface ClaimRewardResult {
  error?: string;
  reward?: DailyRewardItem;
  newStreak?: number;
  papersLeft?: number;
  coins?: number;
}

export async function claimDailyReward(): Promise<ClaimRewardResult> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Please sign in first.' };

  const status = await getRewardStatus();
  if (!status.canClaimToday) {
    return { error: "You already claimed today's reward. Come back tomorrow!" };
  }

  const newStreak = status.streak + 1;
  const dayIndex = ((newStreak - 1) % 20) + 1;
  const reward = REWARD_DAYS[dayIndex - 1];
  const today = getLagosDateString();

  const admin = createAdminClient();
  const { error } = await admin.from('notifications').insert({
    user_id: user.id,
    kind: 'daily_reward_claimed',
    title: `Day ${dayIndex} Reward`,
    body: reward.title,
    read_at: new Date().toISOString(),
    data: {
      day: dayIndex,
      streak: newStreak,
      reward_day: today,
      papers_awarded: reward.papers,
      coins_awarded: reward.coins,
      reward_type: reward.icon,
    },
  });

  if (error) {
    return { error: 'Could not claim reward right now. Please try again.' };
  }

  revalidatePath('/home');
  revalidatePath('/write');
  revalidatePath('/me');

  return {
    reward,
    newStreak,
    papersLeft: status.papersLeft + reward.papers,
    coins: status.coins + reward.coins,
  };
}
