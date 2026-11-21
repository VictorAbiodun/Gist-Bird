import type { InboxItem, Scarf } from '@/lib/types';

export interface TreeEnvelope {
  id: string; // Paper ID
  paperId: string;
  state: 'landed' | 'opened';
  landedAt: string;
  body: string | null;
  fromName: string;
  fromScarf: Scarf;
  fromAvatar?: string;
  interests: string[];
  spot: string | null;
  x: number; // Percentage across tree canopy (horizontal)
  y: number; // Percentage down tree canopy (vertical)
  swayDuration: number; // Pendulum duration in seconds
  swayDelay: number; // Start offset in seconds
  swayAngle: number; // Sway rotation amplitude in degrees
  stringHeight: number; // Length of hanging twine thread in px
}

// 16 naturally distributed branch anchor spots across the tree illustration canopy
export const CANOPY_BRANCH_POSITIONS = [
  // Tier 1: Prime Center & Upper Canopy
  { x: 50, y: 20 },
  { x: 38, y: 17 },
  { x: 62, y: 18 },

  // Tier 2: Mid-High Branches
  { x: 28, y: 24 },
  { x: 72, y: 23 },
  { x: 44, y: 26 },
  { x: 56, y: 27 },

  // Tier 3: Mid Canopy (widest branch span)
  { x: 22, y: 31 },
  { x: 78, y: 30 },
  { x: 34, y: 35 },
  { x: 66, y: 34 },
  { x: 50, y: 35 },

  // Tier 4: Lower Canopy Branches
  { x: 26, y: 41 },
  { x: 74, y: 40 },
  { x: 40, y: 43 },
  { x: 60, y: 43 },
];

/**
 * Calculates a unique, natural branch coordinate for an envelope.
 * Uses natural canopy anchor points with subtle pseudo-random organic jitter.
 * If total envelopes exceed anchors, uses procedural phyllotaxis spiral distribution.
 */
export function getBranchPosition(index: number, total: number): { x: number; y: number } {
  if (index < CANOPY_BRANCH_POSITIONS.length) {
    const base = CANOPY_BRANCH_POSITIONS[index];
    // Organic deterministic jitter based on index so envelopes don't look machine-aligned
    const jitterX = ((index * 7 + 3) % 7) - 3;
    const jitterY = ((index * 11 + 5) % 5) - 2;
    return {
      x: Math.max(16, Math.min(84, base.x + jitterX)),
      y: Math.max(14, Math.min(45, base.y + jitterY)),
    };
  }

  // Phyllotaxis spiral for large inboxes so no envelope is hidden
  const goldenAngle = 2.399963;
  const angle = index * goldenAngle;
  const radiusX = 14 + ((index * 3) % 24);
  const radiusY = 8 + ((index * 2) % 18);
  const x = 50 + radiusX * Math.cos(angle);
  const y = 29 + radiusY * Math.sin(angle);

  return {
    x: Math.max(14, Math.min(86, x)),
    y: Math.max(14, Math.min(46, y)),
  };
}

/**
 * Maps a real recipient InboxItem from Supabase into an interactive hanging TreeEnvelope.
 */
export function inboxItemToEnvelope(item: InboxItem, index: number, total: number): TreeEnvelope {
  const pos = getBranchPosition(index, total);

  // Independent swinging physics for organic natural sway
  const swayDuration = 2.8 + ((index * 0.73) % 1.8); // 2.8s - 4.6s distinct pendulum period
  const swayDelay = (index * 0.41) % 2.2; // Staggered cycle phase
  const swayAngle = 3 + ((index * 2) % 4); // 3deg - 6deg sway amplitude
  const stringHeight = 12 + (index % 4) * 3; // 12px - 21px hanging string

  return {
    id: item.id,
    paperId: item.id,
    state: item.state,
    landedAt: item.landed_at,
    body: item.body,
    fromName: item.from_name || 'Anonymous',
    fromScarf: item.from_scarf || 'coral',
    fromAvatar: item.from_avatar,
    interests: item.interests || [],
    spot: item.spot,
    x: pos.x,
    y: pos.y,
    swayDuration,
    swayDelay,
    swayAngle,
    stringHeight,
  };
}
