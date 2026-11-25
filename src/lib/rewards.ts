export const INITIAL_FREE_PAPERS = 5;
/** Papers sent before this cutoff do not deduct from existing users' starter balance. */
export const FINITE_ECONOMY_CUTOFF = '2026-11-25T09:30:00Z';

export type RewardIconType =
  | 'paper'
  | 'papers_bundle'
  | 'whistle'
  | 'mug'
  | 'coin'
  | 'coins_stack'
  | 'chest'
  | 'flower'
  | 'bird_seed'
  | 'gold';

export interface DailyRewardItem {
  day: number;
  icon: RewardIconType;
  displayQty: string;
  papers: number;
  coins: number;
  title: string;
}

/**
 * 20-day repeating streak calendar (5 columns x 4 rows).
 * Every day awards at least 1 paper so users with 0 papers can always earn more via daily check-ins.
 */
export const REWARD_DAYS: DailyRewardItem[] = [
  // Row 1 (Days 1-5)
  { day: 1, icon: 'paper', displayQty: 'x1', papers: 1, coins: 0, title: '1 Paper' },
  { day: 2, icon: 'whistle', displayQty: 'x1', papers: 1, coins: 1, title: '1 Paper + 1 Coin' },
  { day: 3, icon: 'mug', displayQty: 'x1', papers: 1, coins: 1, title: '1 Paper + 1 Coin' },
  { day: 4, icon: 'coin', displayQty: 'x2', papers: 1, coins: 2, title: '2 Coins + 1 Paper' },
  { day: 5, icon: 'chest', displayQty: 'x1', papers: 3, coins: 3, title: 'Chest: 3 Papers + 3 Coins' },

  // Row 2 (Days 6-10)
  { day: 6, icon: 'paper', displayQty: 'x2', papers: 2, coins: 0, title: '2 Papers' },
  { day: 7, icon: 'whistle', displayQty: 'x1', papers: 1, coins: 2, title: '1 Paper + 2 Coins' },
  { day: 8, icon: 'flower', displayQty: 'x1', papers: 2, coins: 2, title: '2 Papers + 2 Coins' },
  { day: 9, icon: 'coin', displayQty: 'x4', papers: 1, coins: 4, title: '4 Coins + 1 Paper' },
  { day: 10, icon: 'chest', displayQty: 'x1', papers: 3, coins: 5, title: 'Chest: 3 Papers + 5 Coins' },

  // Row 3 (Days 11-15)
  { day: 11, icon: 'paper', displayQty: 'x2', papers: 2, coins: 0, title: '2 Papers' },
  { day: 12, icon: 'whistle', displayQty: 'x1', papers: 1, coins: 3, title: '1 Paper + 3 Coins' },
  { day: 13, icon: 'bird_seed', displayQty: 'x1', papers: 2, coins: 3, title: '2 Papers + 3 Coins' },
  { day: 14, icon: 'coin', displayQty: 'x6', papers: 1, coins: 6, title: '6 Coins + 1 Paper' },
  { day: 15, icon: 'chest', displayQty: 'x1', papers: 4, coins: 6, title: 'Chest: 4 Papers + 6 Coins' },

  // Row 4 (Days 16-20)
  { day: 16, icon: 'papers_bundle', displayQty: 'x5', papers: 5, coins: 0, title: '5 Papers' },
  { day: 17, icon: 'whistle', displayQty: 'x1', papers: 2, coins: 3, title: '2 Papers + 3 Coins' },
  { day: 18, icon: 'gold', displayQty: 'x1', papers: 2, coins: 8, title: 'Gold Bar: 2 Papers + 8 Coins' },
  { day: 19, icon: 'coins_stack', displayQty: 'x10', papers: 2, coins: 10, title: '10 Coins + 2 Papers' },
  { day: 20, icon: 'chest', displayQty: 'x1', papers: 5, coins: 12, title: 'Grand Chest: 5 Papers + 12 Coins' },
];

export interface RewardStatus {
  papersLeft: number;
  coins: number;
  streak: number;
  currentDay: number;
  canClaimToday: boolean;
  todayClaimedDay: number | null;
  lastRewardDay: string | null;
}

export function getLagosDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(date);
}
