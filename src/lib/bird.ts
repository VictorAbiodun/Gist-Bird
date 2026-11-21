export interface BirdStats {
  name: string;
  ageDays: number;
  level: number;
  title: string;
  speedBoostPercent: number;
  xp: number;
  nextLevelXp: number;
}

export function getBirdStats(
  createdAt?: string | Date | null,
  papersUsed: number = 0,
  customName?: string | null
): BirdStats {
  const name = customName?.trim() || 'Chief Coo';

  // Calculate age in days (minimum 1 day)
  const createdTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  const diffDays = Math.max(1, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24)));

  // Experience points: each day active gives 10 XP, each paper sent gives 15 XP
  const xp = diffDays * 10 + papersUsed * 15;

  let level = 1;
  let title = 'Fledgling';
  let speedBoostPercent = 0;
  let nextLevelXp = 50;

  if (xp >= 700 || diffDays >= 30) {
    level = 5;
    title = 'Chief Aviator';
    speedBoostPercent = 25;
    nextLevelXp = 1000;
  } else if (xp >= 350 || diffDays >= 14) {
    level = 4;
    title = 'Master Navigator';
    speedBoostPercent = 18;
    nextLevelXp = 700;
  } else if (xp >= 150 || diffDays >= 7) {
    level = 3;
    title = 'Senior Courier';
    speedBoostPercent = 12;
    nextLevelXp = 350;
  } else if (xp >= 50 || diffDays >= 3) {
    level = 2;
    title = 'Swift Scout';
    speedBoostPercent = 6;
    nextLevelXp = 150;
  }

  return {
    name,
    ageDays: diffDays,
    level,
    title,
    speedBoostPercent,
    xp,
    nextLevelXp,
  };
}

/**
 * Calculates delivery flight duration in milliseconds, factoring in distance and bird speed boost.
 */
export function calculateFlightDuration(
  distanceUnits: number,
  speedBoostPercent: number = 0,
  minDurationMs: number = 3000,
  maxDurationMs: number = 8000
): number {
  // Base flight duration based on canvas pixel distance
  const baseMs = Math.max(minDurationMs, Math.min(maxDurationMs, (distanceUnits / 110) * 1000));
  // Speed boost reduces flight duration (capped at 30% reduction)
  const reduction = Math.min(0.3, Math.max(0, speedBoostPercent / 100));
  return Math.round(baseMs * (1 - reduction));
}
