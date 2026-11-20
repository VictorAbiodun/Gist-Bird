'use client';

import { MAP_SIZE, SPOTS, getSpot, isPickable, arcControl, arcPoint } from '@/lib/campus';
import { CampusBuildings } from './CampusBuildings';

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
  const a = arc ? getSpot(arc.from) : undefined;
  const b = arc ? getSpot(arc.to) : undefined;
  const bird = a && b ? arcPoint(a, b, arc!.t) : null;
  const c = a && b ? arcControl(a, b) : null;
  const alt = arc ? Math.sin(arc.t * Math.PI) : 0;

  return (
    <svg
      viewBox={`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`}
      role="img"
      aria-label={label}
      className={`w-full rounded-card border-[1.5px] border-line bg-[#E3EEE6] shadow-sm select-none ${className}`}
    >
      <rect width={MAP_SIZE.w} height={MAP_SIZE.h} rx="16" fill="#E3EEE6" />

      {/* Landscape Groves */}
      <ellipse cx="140" cy="180" rx="90" ry="60" fill="#D3E6DA" opacity="0.8" />
      <ellipse cx="480" cy="230" rx="110" ry="70" fill="#D3E6DA" opacity="0.8" />
      <ellipse cx="640" cy="450" rx="80" ry="120" fill="#D3E6DA" opacity="0.8" />
      <ellipse cx="320" cy="630" rx="140" ry="50" fill="#D3E6DA" opacity="0.8" />
      <circle cx="365" cy="485" r="42" fill="#C5DFCE" />

      {/* Decorative Campus Trees */}
      {[
        [90, 80], [130, 95], [230, 130], [330, 160], [470, 190],
        [350, 270], [330, 360], [420, 370], [580, 220], [670, 290],
        [730, 430], [740, 560], [730, 720], [550, 660], [440, 590],
        [240, 600], [140, 610]
      ].map(([tx, ty], idx) => (
        <g key={idx} fill="#5B9E78" opacity="0.75">
          <circle cx={tx + 3} cy={ty + 4} r="7" fill="rgba(10,40,20,0.15)" />
          <circle cx={tx} cy={ty} r="8" />
          <circle cx={tx + 5} cy={ty + 3} r="6" fill="#4B8D68" />
        </g>
      ))}

      {/* Road Network (from draft) */}
      <g id="roads" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g stroke="#B9C7BF" strokeWidth="24">
          <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
          <polyline points="410,215 395,305 380,395 365,485" />
          <polyline points="700,620 100,650" />
        </g>
        <g stroke="#FFFFFF" strokeWidth="16">
          <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
          <polyline points="410,215 395,305 380,395 365,485" />
          <polyline points="700,620 100,650" />
        </g>
        <g stroke="#CBD6CF" strokeWidth="2" strokeDasharray="6 6">
          <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
          <polyline points="410,215 395,305 380,395 365,485" />
          <polyline points="700,620 100,650" />
        </g>
      </g>

      <text x="715" y="705" fontSize="12" fill="#5B6770" fontWeight="500">very long straight road</text>
      <text x="715" y="640" fontSize="12" fill="#5B6770" fontWeight="500">T-junction</text>

      {/* 3D Campus Buildings */}
      <CampusBuildings selected={selected} onSelect={onSelect} />

      {/* Flight Arc */}
      {a && b && c && (
        <>
          <path d={`M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`} stroke="#0A7D3E" strokeWidth="3.5" strokeDasharray="6 8" opacity="0.4" fill="none" />
          <path d={`M${a.x} ${a.y} Q${c.x} ${c.y} ${b.x} ${b.y}`} stroke="#FFD23F" strokeWidth="4.5" strokeDasharray="8 6" fill="none" className="animate-pulse" />
        </>
      )}

      {/* Spots */}
      {SPOTS.map((s) => {
        const sel = selected === s.id;
        const pick = onSelect && isPickable(s);
        const isFaculty = s.kind === 'faculty';
        const isJunction = s.kind === 'junction';
        const dotColor = sel ? '#FFD23F' : isFaculty ? '#C2762E' : '#2F5D50';
        const r = sel ? 12 : 8;

        return (
          <g
            key={s.id}
            {...(pick ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': `Pick ${s.name}`,
              'aria-pressed': sel,
              onClick: () => onSelect!(s.id),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect!(s.id);
                }
              },
              style: { cursor: 'pointer' },
            } : {})}
          >
            {pick && <circle cx={s.x} cy={s.y} r="28" fill="transparent" />}
            {sel && <circle cx={s.x} cy={s.y} r="18" fill="none" stroke="#0E2A1B" strokeWidth="2.5" className="animate-ping" opacity="0.6" />}
            <circle cx={s.x} cy={s.y} r={r + 4} fill={sel ? '#FFFFFF' : 'none'} stroke={sel ? '#0E2A1B' : '#B9C7BF'} strokeWidth={sel ? 2.5 : 1.5} />
            <circle cx={s.x} cy={s.y} r={r} fill={dotColor} stroke="#FFFFFF" strokeWidth={2} />
            {!isJunction && (
              <text
                x={s.x}
                y={s.y + (s.y > 500 ? 24 : -16)}
                textAnchor="middle"
                fontSize={sel ? '14' : '12'}
                fontWeight={sel ? '800' : '600'}
                fill="#0E2A1B"
                stroke="#FFFFFF"
                strokeWidth="4"
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {s.name}
              </text>
            )}
          </g>
        );
      })}

      {/* Flying Bird */}
      {bird && (
        <g transform={`translate(${bird.x}, ${bird.y - alt * 35}) rotate(${bird.angle})`}>
          {/* Shadow on ground */}
          <ellipse cx={8 * alt} cy={14 * alt + alt * 35} rx={16 + 10 * alt} ry={8 + 6 * alt} fill="rgba(14,42,27,0.3)" />
          {/* Bird body */}
          <circle cx="0" cy="0" r="14" fill="#7F90A3" stroke="#0E2A1B" strokeWidth="1.8" />
          <polygon points="10,-2 18,1 10,4" fill="#FF8A3D" />
          {/* Wings */}
          <path d="M-4,-4 C-10,-16 -20,-18 -26,-8 C-16,-9 -8,-5 0,0 Z" fill="#5A6D80" stroke="#0E2A1B" strokeWidth="1.2" />
          <path d="M-4,4 C-10,16 -20,18 -26,8 C-16,9 -8,5 0,0 Z" fill="#5A6D80" stroke="#0E2A1B" strokeWidth="1.2" />
          {/* Letter */}
          <rect x="-7" y="6" width="14" height="9" rx="1.5" fill="#FFFBEB" stroke="#0E2A1B" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
