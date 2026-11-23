import data from '@/data/campus.json';

export type SpotKind = 'shared' | 'academic' | 'faculty' | 'gate' | 'junction';
export interface Spot { id: string; name: string; kind: SpotKind; x: number; y: number }

export const MAP_SIZE = { w: 900, h: 820 } as const;
export const SPOTS: Spot[] = data.spots as Spot[];
export const EDGES: [string, string][] = data.edges as [string, string][];

const ALIASES: Record<string, string> = {
  park: 'peace_park',
  cont: 'container',
  health: 'health_centre',
  grave: 'numbers_graveyard',
  food: 'food_mart',
  eng: 'engineering',
  sap: 'sapetro',
};

const byId = new Map<string, Spot>();
for (const s of SPOTS) {
  byId.set(s.id, s);
}
// Also register aliases
for (const [alias, target] of Object.entries(ALIASES)) {
  const targetSpot = byId.get(target);
  if (targetSpot) byId.set(alias, targetSpot);
}

export const getSpot = (id: string | null | undefined): Spot | undefined => (id ? byId.get(id) : undefined);

/** Faculty buildings are pass-through only. They can't be picked as a favourite or starting spot. */
export const isPickable = (s: Spot) => s.kind === 'shared' || s.kind === 'academic' || s.kind === 'gate';
export const PICKABLE_SPOTS = SPOTS.filter(isPickable);

const dist = (a: Spot, b: Spot) => Math.hypot(a.x - b.x, a.y - b.y);

const adjacency = new Map<string, { to: string; d: number }[]>();
for (const [a, b] of EDGES) {
  const sa = byId.get(a)!, sb = byId.get(b)!;
  const d = dist(sa, sb);
  (adjacency.get(a) ?? adjacency.set(a, []).get(a)!).push({ to: b, d });
  (adjacency.get(b) ?? adjacency.set(b, []).get(b)!).push({ to: a, d });
}

/** Shortest path along campus roads (Dijkstra). Mirrors public.spot_distance in the database. */
export function shortestPath(from: string, to: string): { ids: string[]; dist: number } | null {
  const normFrom = ALIASES[from] || from;
  const normTo = ALIASES[to] || to;
  if (!byId.has(normFrom) || !byId.has(normTo)) return null;
  const best = new Map<string, number>([[normFrom, 0]]);
  const prev = new Map<string, string>();
  const todo = new Set<string>([normFrom]);
  while (todo.size) {
    let cur: string | null = null;
    for (const id of todo) if (cur === null || best.get(id)! < best.get(cur)!) cur = id;
    todo.delete(cur!);
    if (cur === normTo) break;
    for (const { to: n, d } of adjacency.get(cur!) ?? []) {
      const nd = best.get(cur!)! + d;
      if (nd < (best.get(n) ?? Infinity)) { best.set(n, nd); prev.set(n, cur!); todo.add(n); }
    }
  }
  if (!best.has(normTo)) return null;
  const ids = [normTo];
  while (ids[0] !== normFrom) ids.unshift(prev.get(ids[0])!);
  return { ids, dist: best.get(normTo)! };
}

export interface FlightConfig { secondsPer100Units: number; min: number; max: number }
export const DEFAULT_FLIGHT: FlightConfig = { secondsPer100Units: 6, min: 15, max: 20 };

export function flightSeconds(distance: number, cfg: FlightConfig = DEFAULT_FLIGHT): number {
  return Math.max(cfg.min, Math.min(cfg.max, Math.round((distance / 100) * cfg.secondsPer100Units)));
}

/** 0 → just sent, 1 → landed. */
export function flightProgress(sentAt: string | Date, landsAt: string | Date, now: number = Date.now()): number {
  const s = new Date(sentAt).getTime(), l = new Date(landsAt).getTime();
  if (!(l > s)) return 1;
  return Math.min(1, Math.max(0, (now - s) / (l - s)));
}

/** Control point for the curved flight arc drawn on the map (from draft). */
export function arcControl(a: Spot, b: Spot): { x: number; y: number } {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const k = Math.min(60, l * 0.18);
  return { x: mx - (dy / l) * k, y: my + (dx / l) * k };
}

export function arcPoint(a: Spot, b: Spot, t: number): { x: number; y: number; angle: number } {
  const c = arcControl(a, b);
  const u = 1 - t;
  const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
  const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
  const tx = 2 * u * (c.x - a.x) + 2 * t * (b.x - c.x);
  const ty = 2 * u * (c.y - a.y) + 2 * t * (b.y - c.y);
  const angle = (Math.atan2(ty, tx) * 180) / Math.PI;
  return { x, y, angle };
}

/** The named landmark Chief Coo is closest to along the road path, for "resting at Chapel" copy. */
export function nearestLandmarkAlong(from: string, to: string, t: number): Spot | undefined {
  const p = shortestPath(from, to);
  if (!p || p.ids.length === 0) return undefined;
  const real = p.ids.map((id) => byId.get(id)!).filter((s) => s.kind !== 'junction');
  if (!real.length) return undefined;
  const i = Math.min(real.length - 1, Math.round(t * (real.length - 1)));
  return real[i];
}

/** Draft map label positioning offsets and text anchors */
export const LABEL_CONFIG: Record<string, { dx: number; dy: number; anchor: 'middle' | 'end' | 'start' }> = {
  gate: { dx: 0, dy: 28, anchor: 'middle' },
  mimis: { dx: 0, dy: -16, anchor: 'middle' },
  nk: { dx: 0, dy: 28, anchor: 'middle' },
  chapel: { dx: 0, dy: -16, anchor: 'middle' },
  lr: { dx: -16, dy: 5, anchor: 'end' },
  labs: { dx: -16, dy: 5, anchor: 'end' },
  field: { dx: -16, dy: 5, anchor: 'end' },
  peace_park: { dx: 0, dy: -16, anchor: 'middle' },
  park: { dx: 0, dy: -16, anchor: 'middle' },
  container: { dx: 16, dy: 5, anchor: 'start' },
  cont: { dx: 16, dy: 5, anchor: 'start' },
  manna: { dx: 16, dy: 5, anchor: 'start' },
  health_centre: { dx: 16, dy: 5, anchor: 'start' },
  health: { dx: 16, dy: 5, anchor: 'start' },
  dp: { dx: 16, dy: 5, anchor: 'start' },
  numbers_graveyard: { dx: 0, dy: -16, anchor: 'middle' },
  grave: { dx: 0, dy: -16, anchor: 'middle' },
  food_mart: { dx: 0, dy: 28, anchor: 'middle' },
  food: { dx: 0, dy: 28, anchor: 'middle' },
  bms: { dx: 0, dy: -16, anchor: 'middle' },
  seap: { dx: 0, dy: 28, anchor: 'middle' },
  engineering: { dx: 0, dy: -16, anchor: 'middle' },
  eng: { dx: 0, dy: -16, anchor: 'middle' },
  sapetro: { dx: 0, dy: 28, anchor: 'middle' },
  sap: { dx: 0, dy: 28, anchor: 'middle' },
};

// Legacy position record compatibility
export const LABEL_POS: Record<string, 'b' | 'a' | 'a2' | 'l' | 'r'> = {
  gate: 'b', mimis: 'a', nk: 'b', chapel: 'a', lr: 'l', labs: 'l', field: 'l', peace_park: 'a', container: 'r',
  manna: 'r', health_centre: 'r', dp: 'r', numbers_graveyard: 'a', food_mart: 'b', bms: 'a', seap: 'b', engineering: 'a', sapetro: 'b',
};
