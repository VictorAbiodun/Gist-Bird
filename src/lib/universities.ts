import rawUniversities from '@/data/nigerian-universities.json';

export interface NigerianUniversity {
  id: string;
  name: string;
  shortName: string;
  motto?: string;
  web?: string;
  logoUrl?: string;
  colors: [string, string];
  monogram: string;
}

const COLOR_MAP: Record<string, [string, string]> = {
  RUN: ['#1B3B8B', '#F2C12E'],
  CU: ['#5B1F69', '#F4C430'],
  BU: ['#0E3A75', '#E8B923'],
  BUI: ['#0D4B82', '#FFFFFF'],
  ABUAD: ['#124E37', '#D4AF37'],
  PAU: ['#0C2D57', '#D9A726'],
  NUN: ['#0B3D91', '#4DB8E8'],
  NTNU: ['#0B3D91', '#4DB8E8'],
  AUN: ['#002868', '#BF0A30'],
  LMU: ['#1E5631', '#D4AF37'],
  ACU: ['#4A235A', '#F4D03F'],
  LCU: ['#1B4F72', '#2ECC71'],
  BIU: ['#6C1D45', '#F4D03F'],
  VUNA: ['#7B241C', '#F4D03F'],
  EU: ['#0E6251', '#D4AC0D'],
  JABU: ['#8E24AA', '#FDD835'],
  MTU: ['#512DA8', '#FBC02D'],
  HUI: ['#1B5E20', '#F9A825'],
  UNILAG: ['#7B1FA2', '#FBC02D'],
  UI: ['#1A237E', '#FFD54F'],
  OAU: ['#1B3B8B', '#F9A825'],
  UNN: ['#1B5E20', '#FFFFFF'],
  ABU: ['#00695C', '#FFD54F'],
  UNIBEN: ['#6A1B9A', '#FFD54F'],
  UNILORIN: ['#0D47A1', '#FFD600'],
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

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isLikelyImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Skip 4icu.org (returns 404) and non-HTTPS URLs (blocked as mixed content on mobile)
  if (!trimmed.startsWith('https://') || trimmed.includes('4icu.org')) return false;
  return /^https:\/\/.+\.(png|jpe?g|webp|svg|gif)(\?.*)?$/i.test(trimmed);
}

function deriveMonogram(name: string, acronym?: string): string {
  const clean = (acronym ?? '').trim();
  if (clean && clean.length <= 5 && !clean.includes(' ')) {
    return clean.toUpperCase();
  }
  const letters = name
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['of', 'and', 'the', 'for'].includes(w.toLowerCase()))
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (letters || name.slice(0, 3)).slice(0, 3).toUpperCase();
}

interface RawUni {
  name: string;
  acronym?: string;
  motto?: string;
  web?: string;
  logo?: string;
}

export const NIGERIAN_UNIVERSITIES: NigerianUniversity[] = (rawUniversities as RawUni[]).map(
  (u, idx) => {
    const monogram = deriveMonogram(u.name, u.acronym);
    const shortName =
      u.acronym && u.acronym.trim().length <= 12 && u.acronym.trim() !== 'Non Found'
        ? u.acronym.trim()
        : monogram;
    const colors = COLOR_MAP[shortName.toUpperCase()] ?? PALETTE[idx % PALETTE.length];

    return {
      id: slugify(u.name),
      name: u.name.trim(),
      shortName,
      motto: u.motto && u.motto !== 'Non Found' ? u.motto : undefined,
      web: u.web,
      logoUrl: isLikelyImageUrl(u.logo) ? u.logo!.trim() : undefined,
      colors,
      monogram,
    };
  }
);

function normalizeUniText(str: string): string {
  return str
    .toLowerCase()
    .replace(/['’.,-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findUniversity(nameOrId?: string | null): NigerianUniversity | undefined {
  if (!nameOrId) return undefined;
  const raw = nameOrId.trim().toLowerCase();
  const norm = normalizeUniText(nameOrId);
  return (
    NIGERIAN_UNIVERSITIES.find((u) => u.id === raw) ||
    NIGERIAN_UNIVERSITIES.find((u) => normalizeUniText(u.name) === norm) ||
    NIGERIAN_UNIVERSITIES.find((u) => normalizeUniText(u.shortName) === norm) ||
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
