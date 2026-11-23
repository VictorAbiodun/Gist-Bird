import { describe, expect, it } from 'vitest';
import { SPOTS, EDGES, shortestPath, flightSeconds, flightProgress, isPickable, getSpot, nearestLandmarkAlong, DEFAULT_FLIGHT } from './campus';

describe('campus graph', () => {
  it('connects every spot (one connected tree)', () => {
    for (const s of SPOTS) expect(shortestPath('gate', s.id), s.id).not.toBeNull();
    expect(EDGES.length).toBe(SPOTS.length - 1);
  });
  it('is symmetric and zero to itself', () => {
    expect(shortestPath('mimis', 'mimis')!.dist).toBe(0);
    expect(shortestPath('mimis', 'dp')!.dist).toBeCloseTo(shortestPath('dp', 'mimis')!.dist, 6);
  });
  it('routes along the roads, not as the crow flies', () => {
    const p = shortestPath('field', 'health_centre')!;
    expect(p.ids).toEqual(['field', 'labs', 'lr', 'chapel', 'peace_park', 'container', 'manna', 'health_centre']);
  });
  it('rejects unknown spots', () => expect(shortestPath('gate', 'nowhere')).toBeNull());
  it('does not let faculty buildings be picked', () => {
    expect(isPickable(getSpot('bms')!)).toBe(false);
    expect(isPickable(getSpot('mimis')!)).toBe(true);
  });
});

describe('flight time', () => {
  it('clamps to the configured min and max', () => {
    expect(flightSeconds(1)).toBe(DEFAULT_FLIGHT.min);
    expect(flightSeconds(1_000_000)).toBe(DEFAULT_FLIGHT.max);
  });
  it('scales with distance', () => {
    expect(flightSeconds(300)).toBe(18);
  });
  it('reports progress between 0 and 1', () => {
    const s = '2026-01-01T00:00:00Z', l = '2026-01-01T00:01:00Z';
    expect(flightProgress(s, l, new Date('2025-12-31T23:59:00Z').getTime())).toBe(0);
    expect(flightProgress(s, l, new Date('2026-01-01T00:00:30Z').getTime())).toBeCloseTo(0.5);
    expect(flightProgress(s, l, new Date('2026-01-01T01:00:00Z').getTime())).toBe(1);
  });
  it('names a landmark to rest at', () => {
    expect(nearestLandmarkAlong('nk', 'dp', 0)!.id).toBe('nk');
    expect(nearestLandmarkAlong('nk', 'dp', 1)!.id).toBe('dp');
  });
});
