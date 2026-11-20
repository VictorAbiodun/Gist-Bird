'use client';
import { MAP_SIZE, SPOTS, EDGES, LABEL_POS, getSpot, isPickable, arcControl, arcPoint } from '@/lib/campus';

const TREES: [number, number][] = [[40, 60], [72, 92], [520, 50], [500, 120], [40, 300], [62, 345], [520, 290], [508, 340], [250, 150], [300, 120], [400, 330], [360, 640], [300, 705], [500, 560], [522, 610], [30, 520], [60, 560]];
const roadPath = EDGES.map(([a, b]) => { const A = getSpot(a)!, B = getSpot(b)!; return `M${A.x} ${A.y}L${B.x} ${B.y}`; }).join('');

interface Props {
  /** Flight arc between two spot ids; the bird sits at progress t (0..1). */
  arc?: { from: string; to: string; t: number } | null;
  selected?: string | null;
  /** When set, shared spots become tappable (favourite spot / starting spot pickers). */
  onSelect?: (id: string) => void;
  className?: string;
  label?: string;
}

export function CampusMap({ arc, selected, onSelect, className = '', label = 'Campus map' }: Props) {
  const a = arc ? getSpot(arc.from) : undefined, b = arc ? getSpot(arc.to) : undefined;
  const bird = a && b ? arcPoint(a, b, arc!.t) : null;
  const c = a && b ? arcControl(a, b) : null;
  return (
    <svg viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`} role="img" aria-label={label} className={`w-full rounded-card bg-[#D9F0DF] ${className}`}>
      <ellipse cx="90" cy="130" rx="120" ry="80" fill="#C3E6CD" /><ellipse cx="410" cy="140" rx="90" ry="60" fill="#C3E6CD" />
      <ellipse cx="70" cy="620" rx="90" ry="90" fill="#C3E6CD" /><ellipse cx="470" cy="700" rx="110" ry="70" fill="#C3E6CD" />
      <ellipse cx="300" cy="400" rx="62" ry="34" fill="#BFE6FF" />
      <rect x="92" y="420" width="76" height="46" rx="8" fill="#A8DDB8" stroke="#fff" strokeWidth="2" />
      {TREES.map(([x, y]) => <g key={`${x}-${y}`} fill="#6FBF8B"><circle cx={x} cy={y} r="8" /><circle cx={x + 9} cy={y + 5} r="6" /></g>)}
      <path d={roadPath} stroke="#9CD4AE" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={roadPath} stroke="#fff" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {a && b && c && <path d={`M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`} stroke="#0A7D3E" strokeWidth="4" strokeDasharray="1 10" strokeLinecap="round" fill="none" />}

      {SPOTS.map((s) => {
        const sel = selected === s.id, pick = onSelect && isPickable(s);
        const r = s.kind === 'junction' ? 5 : s.kind === 'gate' ? 12 : 9;
        const rr = sel ? r + 4 : r, pos = LABEL_POS[s.id];
        const text = s.name + (s.kind === 'faculty' ? ' · faculty' : '');
        const anchor = pos === 'l' ? 'end' : pos === 'r' ? 'start' : 'middle';
        const tx = pos === 'l' ? s.x - rr - 8 : pos === 'r' ? s.x + rr + 8 : s.x;
        const ty = pos === 'b' ? s.y + rr + 22 : pos === 'a' ? s.y - rr - 10 : pos === 'a2' ? s.y - rr - 34 : s.y + 6;
        const fill = sel ? '#FFD23F' : s.kind === 'academic' ? '#FF6B57' : s.kind === 'gate' ? '#FFD23F' : s.kind === 'junction' ? '#fff' : '#0A7D3E';
        return (
          <g key={s.id}
            {...(pick ? { role: 'button', tabIndex: 0, 'aria-label': `Pick ${s.name}`, 'aria-pressed': sel, onClick: () => onSelect!(s.id), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect!(s.id); } }, style: { cursor: 'pointer' } } : {})}>
            {pick && <circle cx={s.x} cy={s.y} r="30" fill="transparent" />}
            {s.kind === 'faculty'
              ? <circle cx={s.x} cy={s.y} r={rr} fill="#fff" stroke="#0E2A1B" strokeWidth="2" strokeDasharray="4 3" />
              : <circle cx={s.x} cy={s.y} r={rr} fill={fill} stroke={sel ? '#0E2A1B' : '#fff'} strokeWidth={sel ? 3 : 3} />}
            {s.kind !== 'junction' && (
              <text x={tx} y={ty} textAnchor={anchor} fontSize="18" fontWeight={sel ? 800 : 700} fill="#0E2A1B" stroke="#fff" strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">{text}</text>
            )}
          </g>
        );
      })}
      {bird && <image href="/mascot/fly.svg" x={bird.x - 36} y={bird.y - 50} width="72" height="86" style={{ transition: 'x 1s linear, y 1s linear' }} />}
    </svg>
  );
}
