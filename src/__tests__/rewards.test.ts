import { describe, expect, it } from 'vitest';
import { INITIAL_FREE_PAPERS, REWARD_DAYS } from '@/lib/rewards';

describe('daily rewards & finite papers', () => {
  it('starts new users with exactly 5 free papers', () => {
    expect(INITIAL_FREE_PAPERS).toBe(5);
  });

  it('defines a complete 20-day streak calendar', () => {
    expect(REWARD_DAYS).toHaveLength(20);
    expect(REWARD_DAYS.map((d) => d.day)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it('awards at least 1 paper on every daily reward so 0-paper users can always recover', () => {
    for (const item of REWARD_DAYS) {
      expect(item.papers).toBeGreaterThanOrEqual(1);
    }
  });
});
