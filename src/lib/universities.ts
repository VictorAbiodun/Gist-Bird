export interface NigerianUniversity {
  id: string;
  name: string;
  shortName: string;
  type: 'Private' | 'Federal' | 'State';
  colors: [string, string];
  monogram: string;
}

export const NIGERIAN_UNIVERSITIES: NigerianUniversity[] = [
  // ── Private Universities in Nigeria ──
  { id: 'run', name: "Redeemer's University (RUN)", shortName: 'RUN', type: 'Private', colors: ['#1B3B8B', '#F2C12E'], monogram: 'RUN' },
  { id: 'covenant', name: 'Covenant University', shortName: 'Covenant', type: 'Private', colors: ['#5B1F69', '#F4C430'], monogram: 'CU' },
  { id: 'babcock', name: 'Babcock University', shortName: 'Babcock', type: 'Private', colors: ['#0E3A75', '#E8B923'], monogram: 'BU' },
  { id: 'abuad', name: 'Afe Babalola University (ABUAD)', shortName: 'ABUAD', type: 'Private', colors: ['#124E37', '#D4AF37'], monogram: 'ABU' },
  { id: 'bowen', name: 'Bowen University', shortName: 'Bowen', type: 'Private', colors: ['#0D4B82', '#FFFFFF'], monogram: 'BU' },
  { id: 'pau', name: 'Pan-Atlantic University (PAU)', shortName: 'PAU', type: 'Private', colors: ['#0C2D57', '#D9A726'], monogram: 'PAU' },
  { id: 'nile', name: 'Nile University of Nigeria', shortName: 'Nile', type: 'Private', colors: ['#0B3D91', '#4DB8E8'], monogram: 'NUN' },
  { id: 'baze', name: 'Baze University', shortName: 'Baze', type: 'Private', colors: ['#1A365D', '#C53030'], monogram: 'BU' },
  { id: 'aun', name: 'American University of Nigeria (AUN)', shortName: 'AUN', type: 'Private', colors: ['#002868', '#BF0A30'], monogram: 'AUN' },
  { id: 'landmark', name: 'Landmark University', shortName: 'Landmark', type: 'Private', colors: ['#1E5631', '#D4AF37'], monogram: 'LMU' },
  { id: 'bells', name: 'Bells University of Technology', shortName: 'Bells Tech', type: 'Private', colors: ['#0B5345', '#F1C40F'], monogram: 'BUT' },
  { id: 'caleb', name: 'Caleb University', shortName: 'Caleb', type: 'Private', colors: ['#2C3E50', '#E67E22'], monogram: 'CU' },
  { id: 'crawford', name: 'Crawford University', shortName: 'Crawford', type: 'Private', colors: ['#1F618D', '#F39C12'], monogram: 'CRU' },
  { id: 'ajayi-crowther', name: 'Ajayi Crowther University', shortName: 'ACU', type: 'Private', colors: ['#4A235A', '#F4D03F'], monogram: 'ACU' },
  { id: 'lead-city', name: 'Lead City University', shortName: 'Lead City', type: 'Private', colors: ['#1B4F72', '#2ECC71'], monogram: 'LCU' },
  { id: 'igbinedion', name: 'Igbinedion University Okada', shortName: 'IUO', type: 'Private', colors: ['#7D1E1E', '#F1C40F'], monogram: 'IUO' },
  { id: 'madonna', name: 'Madonna University', shortName: 'Madonna', type: 'Private', colors: ['#154360', '#F7DC6F'], monogram: 'MU' },
  { id: 'biu', name: 'Benson Idahosa University', shortName: 'BIU', type: 'Private', colors: ['#6C1D45', '#F4D03F'], monogram: 'BIU' },
  { id: 'veritas', name: 'Veritas University Abuja', shortName: 'Veritas', type: 'Private', colors: ['#7B241C', '#F4D03F'], monogram: 'VUNA' },
  { id: 'elizade', name: 'Elizade University', shortName: 'Elizade', type: 'Private', colors: ['#0E6251', '#D4AC0D'], monogram: 'EU' },
  { id: 'jabu', name: 'Joseph Ayo Babalola University', shortName: 'JABU', type: 'Private', colors: ['#8E24AA', '#FDD835'], monogram: 'JABU' },
  { id: 'adeleke', name: 'Adeleke University', shortName: 'Adeleke', type: 'Private', colors: ['#1A237E', '#FFB300'], monogram: 'AU' },
  { id: 'mcpherson', name: 'McPherson University', shortName: 'McPherson', type: 'Private', colors: ['#0D47A1', '#FFD54F'], monogram: 'MCU' },
  { id: 'mtu', name: 'Mountain Top University', shortName: 'MTU', type: 'Private', colors: ['#512DA8', '#FBC02D'], monogram: 'MTU' },
  { id: 'fountain', name: 'Fountain University', shortName: 'Fountain', type: 'Private', colors: ['#00695C', '#FFD54F'], monogram: 'FUO' },
  { id: 'al-hikmah', name: 'Al-Hikmah University', shortName: 'Al-Hikmah', type: 'Private', colors: ['#1B5E20', '#F9A825'], monogram: 'AHU' },
  { id: 'crescent', name: 'Crescent University', shortName: 'Crescent', type: 'Private', colors: ['#004D40', '#FDD835'], monogram: 'CUAB' },
  { id: 'kings', name: 'Kings University', shortName: 'Kings', type: 'Private', colors: ['#4A148C', '#FFD700'], monogram: 'KU' },
  { id: 'augustine', name: 'Augustine University', shortName: 'Augustine', type: 'Private', colors: ['#880E4F', '#FFC107'], monogram: 'AUI' },
  { id: 'gregory', name: 'Gregory University Uturu', shortName: 'Gregory', type: 'Private', colors: ['#01579B', '#FFB300'], monogram: 'GUU' },
  { id: 'godfrey-okoye', name: 'Godfrey Okoye University', shortName: 'GOUNI', type: 'Private', colors: ['#1A237E', '#C62828'], monogram: 'GOU' },
  { id: 'rhema', name: 'Rhema University', shortName: 'Rhema', type: 'Private', colors: ['#283593', '#FDD835'], monogram: 'RU' },
  { id: 'paul', name: 'Paul University Awka', shortName: 'Paul', type: 'Private', colors: ['#311B92', '#FFD54F'], monogram: 'PU' },
  { id: 'wesley', name: 'Wesley University Ondo', shortName: 'Wesley', type: 'Private', colors: ['#0D47A1', '#E53935'], monogram: 'WUO' },
  { id: 'oduduwa', name: 'Oduduwa University', shortName: 'Oduduwa', type: 'Private', colors: ['#1B5E20', '#FBC02D'], monogram: 'OUI' },
  { id: 'achievers', name: 'Achievers University Owo', shortName: 'Achievers', type: 'Private', colors: ['#004D40', '#FF8F00'], monogram: 'AUO' },
  { id: 'wellspring', name: 'Wellspring University', shortName: 'Wellspring', type: 'Private', colors: ['#0277BD', '#FDD835'], monogram: 'WU' },
  { id: 'salem', name: 'Salem University Lokoja', shortName: 'Salem', type: 'Private', colors: ['#4E342E', '#FFB300'], monogram: 'SU' },
  { id: 'anchor', name: 'Anchor University Lagos', shortName: 'Anchor', type: 'Private', colors: ['#1565C0', '#FFD54F'], monogram: 'AUL' },
  { id: 'christopher', name: 'Christopher University', shortName: 'Christopher', type: 'Private', colors: ['#2E7D32', '#FBC02D'], monogram: 'CU' },
  { id: 'dominican', name: 'Dominican University Ibadan', shortName: 'Dominican', type: 'Private', colors: ['#212121', '#D4AF37'], monogram: 'DUI' },
  { id: 'trinity', name: 'Trinity University', shortName: 'Trinity', type: 'Private', colors: ['#1B5E20', '#FFD600'], monogram: 'TU' },
  { id: 'koladaisi', name: 'KolaDaisi University', shortName: 'KolaDaisi', type: 'Private', colors: ['#0D47A1', '#FF6F00'], monogram: 'KDU' },
  { id: 'precious-cornerstone', name: 'Precious Cornerstone University', shortName: 'PCU', type: 'Private', colors: ['#4A148C', '#FFD54F'], monogram: 'PCU' },
  { id: 'skyline', name: 'Skyline University Nigeria', shortName: 'Skyline', type: 'Private', colors: ['#006064', '#FFB300'], monogram: 'SUN' },
  { id: 'admiralty', name: 'Admiralty University of Nigeria', shortName: 'ADUN', type: 'Private', colors: ['#0A2540', '#D4AF37'], monogram: 'ADUN' },
  { id: 'eko-med', name: 'Eko University of Medicine', shortName: 'EkoUNIMED', type: 'Private', colors: ['#B71C1C', '#FFFFFF'], monogram: 'EKO' },
  { id: 'atiba', name: 'Atiba University Oyo', shortName: 'Atiba', type: 'Private', colors: ['#6A1B9A', '#FDD835'], monogram: 'AUO' },
  { id: 'westland', name: 'Westland University', shortName: 'Westland', type: 'Private', colors: ['#00695C', '#FFCA28'], monogram: 'WU' },
  { id: 'greenfield', name: 'Greenfield University', shortName: 'Greenfield', type: 'Private', colors: ['#1B5E20', '#AED581'], monogram: 'GFU' },
  { id: 'wigwe', name: 'Wigwe University', shortName: 'Wigwe', type: 'Private', colors: ['#0F172A', '#EAB308'], monogram: 'WU' },
  { id: 'thomas-adewumi', name: 'Thomas Adewumi University', shortName: 'TAU', type: 'Private', colors: ['#1E3A8A', '#F59E0B'], monogram: 'TAU' },
  { id: 'mudiame', name: 'Mudiame University', shortName: 'Mudiame', type: 'Private', colors: ['#14532D', '#FACC15'], monogram: 'MU' },
  { id: 'philomath', name: 'Philomath University', shortName: 'Philomath', type: 'Private', colors: ['#312E81', '#FBBF24'], monogram: 'PU' },
  { id: 'havilla', name: 'Havilla University', shortName: 'Havilla', type: 'Private', colors: ['#065F46', '#FCD34D'], monogram: 'HU' },
  { id: 'mewar', name: 'Mewar International University', shortName: 'Mewar', type: 'Private', colors: ['#991B1B', '#FDE047'], monogram: 'MIU' },
  { id: 'novena', name: 'Novena University Ogume', shortName: 'Novena', type: 'Private', colors: ['#0D47A1', '#FFD54F'], monogram: 'NU' },
  { id: 'obong', name: 'Obong University', shortName: 'Obong', type: 'Private', colors: ['#1B5E20', '#FFD740'], monogram: 'OU' },
  { id: 'renaissance', name: 'Renaissance University', shortName: 'RNU', type: 'Private', colors: ['#880E4F', '#FFD54F'], monogram: 'RNU' },
  { id: 'tansian', name: 'Tansian University', shortName: 'Tansian', type: 'Private', colors: ['#1A237E', '#FFC107'], monogram: 'TAN' },
  { id: 'caritas', name: 'Caritas University', shortName: 'Caritas', type: 'Private', colors: ['#B71C1C', '#FFD54F'], monogram: 'CU' },
  { id: 'southwestern', name: 'Southwestern University', shortName: 'SWU', type: 'Private', colors: ['#004D40', '#FFCA28'], monogram: 'SWU' },
  { id: 'edwin-clark', name: 'Edwin Clark University', shortName: 'ECU', type: 'Private', colors: ['#01579B', '#FFD54F'], monogram: 'ECU' },
  { id: 'hallmark', name: 'Hallmark University', shortName: 'Hallmark', type: 'Private', colors: ['#283593', '#FFB300'], monogram: 'HU' },
  { id: 'hezekiah', name: 'Hezekiah University', shortName: 'UNIHEZ', type: 'Private', colors: ['#4A148C', '#FFD54F'], monogram: 'UHZ' },
  { id: 'spiritan', name: 'Spiritan University Nneochi', shortName: 'SUN', type: 'Private', colors: ['#C62828', '#FFFFFF'], monogram: 'SUN' },
  { id: 'legacy', name: 'Legacy University Okija', shortName: 'Legacy', type: 'Private', colors: ['#1565C0', '#FFCA28'], monogram: 'LUO' },
  { id: 'claretian', name: 'Claretian University', shortName: 'Claretian', type: 'Private', colors: ['#7F1D1D', '#FBBF24'], monogram: 'CUN' },
  { id: 'ave-maria', name: 'Ave Maria University', shortName: 'Ave Maria', type: 'Private', colors: ['#1E40AF', '#FDE047'], monogram: 'AMU' },

  // ── Major Federal & State Universities ──
  { id: 'unilag', name: 'University of Lagos (UNILAG)', shortName: 'UNILAG', type: 'Federal', colors: ['#7B1FA2', '#FBC02D'], monogram: 'UL' },
  { id: 'ui', name: 'University of Ibadan (UI)', shortName: 'UI', type: 'Federal', colors: ['#1A237E', '#FFD54F'], monogram: 'UI' },
  { id: 'oau', name: 'Obafemi Awolowo University (OAU)', shortName: 'OAU', type: 'Federal', colors: ['#1B3B8B', '#F9A825'], monogram: 'OAU' },
  { id: 'unn', name: 'University of Nigeria, Nsukka (UNN)', shortName: 'UNN', type: 'Federal', colors: ['#1B5E20', '#FFFFFF'], monogram: 'UNN' },
  { id: 'abu', name: 'Ahmadu Bello University (ABU)', shortName: 'ABU', type: 'Federal', colors: ['#00695C', '#FFD54F'], monogram: 'ABU' },
  { id: 'uniben', name: 'University of Benin (UNIBEN)', shortName: 'UNIBEN', type: 'Federal', colors: ['#6A1B9A', '#FFD54F'], monogram: 'UB' },
  { id: 'unilorin', name: 'University of Ilorin (UNILORIN)', shortName: 'UNILORIN', type: 'Federal', colors: ['#0D47A1', '#FFD600'], monogram: 'UIL' },
  { id: 'futa', name: 'Federal University of Technology, Akure (FUTA)', shortName: 'FUTA', type: 'Federal', colors: ['#4A148C', '#FFB300'], monogram: 'FUTA' },
  { id: 'uniport', name: 'University of Port Harcourt (UNIPORT)', shortName: 'UNIPORT', type: 'Federal', colors: ['#1565C0', '#FFCA28'], monogram: 'UPH' },
  { id: 'lasu', name: 'Lagos State University (LASU)', shortName: 'LASU', type: 'State', colors: ['#1B5E20', '#FFD600'], monogram: 'LASU' },
  { id: 'oou', name: 'Olabisi Onabanjo University (OOU)', shortName: 'OOU', type: 'State', colors: ['#004D40', '#FFB300'], monogram: 'OOU' },
];

export function findUniversity(nameOrId?: string | null): NigerianUniversity | undefined {
  if (!nameOrId) return undefined;
  const q = nameOrId.trim().toLowerCase();
  return (
    NIGERIAN_UNIVERSITIES.find((u) => u.id === q) ||
    NIGERIAN_UNIVERSITIES.find((u) => u.name.toLowerCase() === q) ||
    NIGERIAN_UNIVERSITIES.find((u) => u.shortName.toLowerCase() === q) ||
    NIGERIAN_UNIVERSITIES.find((u) => u.name.toLowerCase().includes(q))
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
