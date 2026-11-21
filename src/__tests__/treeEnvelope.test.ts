import { describe, it, expect } from 'vitest';
import { getBranchPosition, inboxItemToEnvelope } from '../components/tree/treeEnvelope';
import type { InboxItem } from '../lib/types';

describe('Message Tree Envelopes', () => {
  it('returns empty array when user has zero unaccepted messages', () => {
    const inbox: InboxItem[] = [];
    const envelopes = inbox.map((item, idx) => inboxItemToEnvelope(item, idx));
    expect(envelopes).toHaveLength(0);
  });

  it('positions single unaccepted message at prime center canopy', () => {
    const single: InboxItem = {
      id: 'paper-1',
      state: 'landed',
      landed_at: new Date().toISOString(),
      body: null,
      from_name: 'Chief Tester',
      from_scarf: 'coral',
      interests: ['Coding', 'Gist'],
      spot: 'Peace Park',
    };

    const env = inboxItemToEnvelope(single, 0);
    expect(env.id).toBe('paper-1');
    expect(env.paperId).toBe('paper-1');
    expect(env.state).toBe('landed');
    expect(env.fromName).toBe('Chief Tester');
    // Coordinates within upper canopy
    expect(env.x).toBeGreaterThanOrEqual(16);
    expect(env.x).toBeLessThanOrEqual(84);
    expect(env.y).toBeGreaterThanOrEqual(14);
    expect(env.y).toBeLessThanOrEqual(45);
    // Independent swinging animation params
    expect(env.swayDuration).toBeGreaterThan(2.5);
    expect(env.swayAngle).toBeGreaterThan(0);
    expect(env.stringHeight).toBeGreaterThan(10);
  });

  it('distributes several unaccepted messages across unique branches without overlapping out of canopy', () => {
    const items: InboxItem[] = Array.from({ length: 8 }, (_, i) => ({
      id: `paper-${i}`,
      state: i % 2 === 0 ? 'landed' : 'opened',
      landed_at: new Date().toISOString(),
      body: i % 2 === 0 ? null : `Opened gist message ${i}`,
      from_name: `User ${i}`,
      from_scarf: 'green',
      interests: ['Football'],
      spot: 'Engineering Hub',
    }));

    const envelopes = items.map((item, idx) => inboxItemToEnvelope(item, idx));
    expect(envelopes).toHaveLength(8);

    // Each envelope must have its own unique position and swing physics
    const positions = new Set<string>();
    const durations = new Set<number>();

    for (const env of envelopes) {
      const posKey = `${env.x.toFixed(1)},${env.y.toFixed(1)}`;
      positions.add(posKey);
      durations.add(env.swayDuration);

      expect(env.x).toBeGreaterThanOrEqual(14);
      expect(env.x).toBeLessThanOrEqual(86);
      expect(env.y).toBeGreaterThanOrEqual(14);
      expect(env.y).toBeLessThanOrEqual(46);
    }

    // All 8 positions must be distinct
    expect(positions.size).toBe(8);
    // Sway durations must be diverse
    expect(durations.size).toBeGreaterThan(3);
  });

  it('handles large message volumes without exceeding canopy boundaries', () => {
    for (let i = 0; i < 25; i++) {
      const pos = getBranchPosition(i);
      expect(pos.x).toBeGreaterThanOrEqual(14);
      expect(pos.x).toBeLessThanOrEqual(86);
      expect(pos.y).toBeGreaterThanOrEqual(14);
      expect(pos.y).toBeLessThanOrEqual(46);
    }
  });

  it('preserves opened vs landed state accurately', () => {
    const landedItem: InboxItem = {
      id: 'p-landed',
      state: 'landed',
      landed_at: new Date().toISOString(),
      body: null,
      from_name: 'Landed Sender',
      from_scarf: 'lemon',
      interests: [],
      spot: null,
    };
    const openedItem: InboxItem = {
      id: 'p-opened',
      state: 'opened',
      landed_at: new Date().toISOString(),
      body: 'I am opened but not yet accepted!',
      from_name: 'Opened Sender',
      from_scarf: 'slate',
      interests: [],
      spot: null,
    };

    const env1 = inboxItemToEnvelope(landedItem, 0);
    const env2 = inboxItemToEnvelope(openedItem, 1);

    expect(env1.state).toBe('landed');
    expect(env2.state).toBe('opened');
    expect(env2.body).toBe('I am opened but not yet accepted!');
  });
});
