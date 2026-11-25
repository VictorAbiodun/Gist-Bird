import narrUniversities from '@/data/narr-universities.json';

export interface NigerianUniversity {
  id: string;
  name: string;
  shortName: string;
  ownership?: string;
  web?: string;
  year?: string;
  logoUrl?: string;
  colors: [string, string];
  monogram: string;
}

const COLOR_MAP: Record<string, [string, string]> = {
  RUN: ['#1B3B8B', '#F2C12E'],
  CU: ['#5B1F69', '#F4C430'],
  BABCOCK: ['#0E3A75', '#E8B923'],
  ABUAD: ['#124E37', '#D4AF37'],
  PAU: ['#0C2D57', '#D9A726'],
  NUN: ['#0B3D91', '#4DB8E8'],
  AUN: ['#002868', '#BF0A30'],
  LMU: ['#1E5631', '#D4AF37'],
  UNILAG: ['#7B1FA2', '#FBC02D'],
  UI: ['#1A237E', '#FFD54F'],
  OAU: ['#1B3B8B', '#F9A825'],
  UNN: ['#1B5E20', '#FFFFFF'],
  ABU: ['#00695C', '#FFD54F'],
  UNIBEN: ['#6A1B9A', '#FFD54F'],
  UIL: ['#0D47A1', '#FFD600'],
  FUTA: ['#4A148C', '#FFB300'],
  UNIPORT: ['#1565C0', '#FFCA28'],
  LASU: ['#1B5E20', '#FFD600'],
};

const PALETTE: Array<[string, string]> = [
  ['#1B3B8B', '#F2C12E'],
  ['#0A7D3E', '#FFD23F'],
  ['#5B1F69', '#F4C430'],
  ['#0E3A75', '#4DB8E8'],
  ['#7D1E1E', '#F1C40F'],
  ['#004D40', '#FFB300'],
];

interface RawNarrUni {
  id: string;
  name: string;
  shortName: string;
  ownership?: string;
  web?: string;
  year?: string;
  logoUrl?: string;
}

export const NIGERIAN_UNIVERSITIES: NigerianUniversity[] = (
  narrUniversities as RawNarrUni[]
).map((u, idx) => {
  const mono = (u.shortName || u.name.slice(0, 3)).slice(0, 4).toUpperCase();
  const colors = COLOR_MAP[u.shortName.toUpperCase()] ?? PALETTE[idx % PALETTE.length];
  return {
    id: u.id,
    name: u.name,
    shortName: u.shortName,
    ownership: u.ownership,
    web: u.web,
    year: u.year,
    logoUrl: u.logoUrl,
    colors,
    monogram: mono,
  };
});

export function normalizeUniText(str: string): string {
  return str
    .toLowerCase()
    .replace(/['’.,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findUniversity(nameOrId?: string | null): NigerianUniversity | undefined {
  if (!nameOrId) return undefined;
  const raw = nameOrId.trim().toLowerCase();
  const norm = normalizeUniText(nameOrId);
  const normNoApostrophe = nameOrId.toLowerCase().replace(/['’.,-]/g, '').replace(/\s+/g, ' ').trim();

  return (
    NIGERIAN_UNIVERSITIES.find((u) => u.id === raw) ||
    NIGERIAN_UNIVERSITIES.find((u) => normalizeUniText(u.name) === norm) ||
    NIGERIAN_UNIVERSITIES.find((u) => normalizeUniText(u.shortName) === norm) ||
    NIGERIAN_UNIVERSITIES.find((u) => u.name.toLowerCase().replace(/['’.,-]/g, '').includes(normNoApostrophe)) ||
    NIGERIAN_UNIVERSITIES.find((u) => normalizeUniText(u.name).includes(norm))
  );
}

export function calculateAgeFromDob(day: number, month: number, year: number): number {
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() + 1 - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return Math.max(13, age);
}

export function formatAgeDob(day: number, month: number, year: number): string {
  const age = calculateAgeFromDob(day, month, year);
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${age} (${dd}/${mm}/${year})`;
}

export function extractAgeNumber(ageStr?: string | null): number | null {
  if (!ageStr) return null;
  const match = ageStr.match(/^\d+/);
  return match ? parseInt(match[0], 10) : null;
}
