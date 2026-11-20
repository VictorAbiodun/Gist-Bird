import data from '@/data/campus.json';

export type SpotKind = 'shared' | 'academic' | 'faculty' | 'gate' | 'junction';
export interface Spot { id: string; name: string; kind: SpotKind; x: number; y: number }

export const MAP_SIZE = { w: 560, h: 800 } as const;
export const SPOTS: Spot[] = data.spots as Spot[];
export const EDGES: [string, string][] = data.edges as [string, string][];

const byId = new Map(SPOTS.map((s) => [s.id, s]));
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
  if (!byId.has(from) || !byId.has(to)) return null;
  const best = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const todo = new Set<string>([from]);
  while (todo.size) {
    let cur: string | null = null;
    for (const id of todo) if (cur === null || best.get(id)! < best.get(cur)!) cur = id;
    todo.delete(cur!);
    if (cur === to) break;
    for (const { to: n, d } of adjacency.get(cur!) ?? []) {
      const nd = best.get(cur!)! + d;
      if (nd < (best.get(n) ?? Infinity)) { best.set(n, nd); prev.set(n, cur!); todo.add(n); }
    }
  }
  if (!best.has(to)) return null;
  const ids = [to];
  while (ids[0] !== from) ids.unshift(prev.get(ids[0])!);
  return { ids, dist: best.get(to)! };
}

export interface FlightConfig { secondsPer100Units: number; min: number; max: number }
export const DEFAULT_FLIGHT: FlightConfig = { secondsPer100Units: 30, min: 20, max: 600 };

export function flightSeconds(distance: number, cfg: FlightConfig = DEFAULT_FLIGHT): number {
  return Math.max(cfg.min, Math.min(cfg.max, Math.round((distance / 100) * cfg.secondsPer100Units)));
}

/** 0 → just sent, 1 → landed. */
export function flightProgress(sentAt: string | Date, landsAt: string | Date, now: number = Date.now()): number {
  const s = new Date(sentAt).getTime(), l = new Date(landsAt).getTime();
  if (!(l > s)) return 1;
  return Math.min(1, Math.max(0, (now - s) / (l - s)));
}

/** Control point for the curved flight arc drawn on the map (matches the Figma design). */
export function arcControl(a: Spot, b: Spot): { x: number; y: number } {
  const dx = b.x - a.x, dy = b.y - a.y;
  let px = dy * 0.3, py = -dx * 0.3;
  if (py > 0) { px = -px; py = -py; }
  return { x: (a.x + b.x) / 2 + px, y: (a.y + b.y) / 2 + py };
}

export function arcPoint(a: Spot, b: Spot, t: number): { x: number; y: number } {
  const c = arcControl(a, b), u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
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

/** Where each label sits relative to its dot on the map: below, above, above (second row), left, right. */
export const LABEL_POS: Record<string, 'b' | 'a' | 'a2' | 'l' | 'r'> = {
  gate: 'b', mimis: 'b', nk: 'b', chapel: 'b', lr: 'l', labs: 'l', field: 'l', peace_park: 'b', container: 'b',
  manna: 'l', health_centre: 'l', dp: 'r', numbers_graveyard: 'a2', food_mart: 'b', bms: 'a', seap: 'b', engineering: 'a2', sapetro: 'b',
};
