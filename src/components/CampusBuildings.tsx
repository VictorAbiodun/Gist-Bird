'use client';

interface CampusBuildingsProps {
  selected?: string | null;
  fromSpot?: string | null;
  toSpot?: string | null;
  onSelect?: (id: string) => void;
  isFlying?: boolean;
}

export function CampusBuildings({
  selected,
  fromSpot,
  toSpot,
  onSelect,
  isFlying,
}: CampusBuildingsProps) {
  const isHighlighted = (id: string) => {
    return selected === id || fromSpot === id || toSpot === id;
  };

  const handleClick = (id: string) => {
    if (onSelect && !isFlying) {
      onSelect(id);
    }
  };

  return (
    <g id="campus-3d-buildings" className="select-none">
      <defs>
        {/* Soft Building Drop Shadow Filter */}
        <filter id="bldg-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="4" dy="6" result="offsetblur" />
          <feFlood floodColor="rgba(14, 42, 27, 0.22)" />
          <feComposite in2="offsetblur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 1. School Gate (gate: 70, 110) - Grand Gateway & Guardhouse */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('gate')}
        filter="url(#bldg-shadow)"
      >
        {isHighlighted('gate') && (
          <ellipse cx="70" cy="115" rx="44" ry="14" fill="none" stroke="#FFD23F" strokeWidth="2.5" className="animate-pulse" />
        )}
        {/* Ground shadow */}
        <ellipse cx="70" cy="115" rx="36" ry="10" fill="rgba(14,42,27,0.18)" />
        {/* Left Pillar */}
        <polygon points="46,110 58,110 58,82 46,82" fill="#D9E2EC" />
        <polygon points="58,110 64,106 64,78 58,82" fill="#BCCCDC" />
        <polygon points="46,82 52,78 64,78 58,82" fill="#F0F4F8" />
        {/* Right Pillar */}
        <polygon points="76,110 88,110 88,82 76,82" fill="#D9E2EC" />
        <polygon points="88,110 94,106 94,78 88,82" fill="#BCCCDC" />
        <polygon points="76,82 82,78 94,78 88,82" fill="#F0F4F8" />
        {/* Archway Beam & Crest */}
        <polygon points="44,82 90,82 90,72 44,72" fill="#0A7D3E" />
        <polygon points="90,82 96,78 96,68 90,72" fill="#0E2A1B" />
        <polygon points="44,72 50,68 96,68 90,72" fill="#15803D" />
        {/* Gold Roof Peak */}
        <polygon points="67,60 52,68 88,68" fill="#FFD23F" stroke="#0E2A1B" strokeWidth="0.8" />
        <circle cx="67" cy="58" r="2.5" fill="#FFD23F" />
      </g>

      {/* 2. Mimis Bistro & Cafe (mimis: 180, 150) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('mimis')}
        filter="url(#bldg-shadow)"
      >
        {isHighlighted('gate') && (
          <ellipse cx="70" cy="115" rx="44" ry="14" fill="none" stroke="#FFD23F" strokeWidth="2.5" className="animate-pulse" />
        )}
        {/* Ground shadow */}
        <ellipse cx="180" cy="132" rx="26" ry="9" fill="rgba(14,42,27,0.18)" />
        {/* Main Cafe Body */}
        <polygon points="164,130 196,130 196,112 164,112" fill="#FFFBEB" />
        <polygon points="196,130 204,124 204,106 196,112" fill="#FDE68A" />
        {/* Red & White Striped Awning */}
        <polygon points="162,118 198,118 198,112 162,112" fill="#FF6B57" />
        <polygon points="166,118 174,118 174,112 166,112" fill="#FFFFFF" />
        <polygon points="180,118 188,118 188,112 180,112" fill="#FFFFFF" />
        <polygon points="194,118 198,118 198,112 194,112" fill="#FFFFFF" />
        {/* Shaded 3D Roof */}
        <polygon points="164,112 180,98 212,98 196,112" fill="#0A7D3E" />
        <polygon points="212,98 204,106 196,112" fill="#0E2A1B" />
        {/* Door & Windows */}
        <rect x="176" y="120" width="8" height="10" fill="#0E2A1B" rx="1" />
        <rect x="187" y="120" width="6" height="6" fill="#93C5FD" rx="1" />
        {/* Coffee Cup / Food Clue */}
        <circle cx="180" cy="94" r="4.5" fill="#FFD23F" stroke="#0E2A1B" strokeWidth="0.8" />
      </g>

      {/* 3. NK Hub (nk: 290, 185) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('nk')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="290" cy="226" rx="28" ry="9" fill="rgba(14,42,27,0.18)" />
        {/* Main Hall */}
        <polygon points="274,224 306,224 306,204 274,204" fill="#E2E8F0" />
        <polygon points="306,224 316,218 316,198 306,204" fill="#94A3B8" />
        {/* Flat Modern Rooftop with AC Units */}
        <polygon points="274,204 284,198 316,198 306,204" fill="#F8FAFC" />
        <rect x="286" y="196" width="8" height="4" fill="#64748B" rx="0.5" />
        {/* Glass Windows Grid */}
        <rect x="278" y="208" width="8" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="292" y="208" width="8" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="278" y="216" width="8" height="6" fill="#38BDF8" rx="0.5" />
        <rect x="292" y="216" width="8" height="6" fill="#0E2A1B" rx="0.5" />
      </g>

      {/* 4. The Grand Chapel (chapel: 410, 215) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('chapel')}
        filter="url(#bldg-shadow)"
      >
        {isHighlighted('gate') && (
          <ellipse cx="70" cy="115" rx="44" ry="14" fill="none" stroke="#FFD23F" strokeWidth="2.5" className="animate-pulse" />
        )}
        {/* Ground shadow */}
        <ellipse cx="410" cy="195" rx="38" ry="12" fill="rgba(14,42,27,0.22)" />
        {/* Front Nave Wall */}
        <polygon points="392,192 428,192 428,162 410,146 392,162" fill="#FFFDF5" stroke="#CBD5E1" strokeWidth="0.5" />
        {/* Side Shaded Nave Wall */}
        <polygon points="428,192 444,182 444,152 428,162" fill="#E2E8F0" />
        {/* Pitched Roof (Navy / Terracotta) */}
        <polygon points="410,146 428,162 444,152 426,136" fill="#1E3A8A" />
        <polygon points="392,162 410,146 426,136 408,152" fill="#2563EB" />
        {/* Spire Tower */}
        <polygon points="406,146 414,146 414,126 406,126" fill="#CBD5E1" />
        <polygon points="414,146 418,142 418,122 414,126" fill="#94A3B8" />
        <polygon points="410,108 406,126 418,122" fill="#0A7D3E" />
        {/* Golden Cross on Top */}
        <line x1="410" y1="102" x2="410" y2="108" stroke="#FFD23F" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="407" y1="104" x2="413" y2="104" stroke="#FFD23F" strokeWidth="1.8" strokeLinecap="round" />
        {/* Stained Glass Rose Window */}
        <circle cx="410" cy="164" r="6" fill="#60A5FA" stroke="#FFD23F" strokeWidth="1" />
        <line x1="410" y1="158" x2="410" y2="170" stroke="#FFD23F" strokeWidth="0.8" />
        <line x1="404" y1="164" x2="416" y2="164" stroke="#FFD23F" strokeWidth="0.8" />
        {/* Arched Door */}
        <path d="M406,192 L406,178 Q410,174 414,178 L414,192 Z" fill="#78350F" />
      </g>

      {/* 5. Lecture Rooms (lr: 395, 305) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('lr')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="340" cy="308" rx="28" ry="8" fill="rgba(14,42,27,0.16)" />
        {/* Stepped Educational Block */}
        <polygon points="320,305 360,305 360,285 320,285" fill="#F8FAFC" />
        <polygon points="360,305 368,299 368,279 360,285" fill="#CBD5E1" />
        <polygon points="320,285 328,279 368,279 360,285" fill="#E2E8F0" />
        {/* Second Tier */}
        <polygon points="328,279 356,279 356,267 328,267" fill="#F1F5F9" />
        <polygon points="356,279 362,274 362,262 356,267" fill="#94A3B8" />
        <polygon points="328,267 334,262 362,262 356,267" fill="#0A7D3E" />
        {/* Windows */}
        <rect x="325" y="289" width="6" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="335" y="289" width="6" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="345" y="289" width="6" height="5" fill="#38BDF8" rx="0.5" />
      </g>

      {/* 6. Labs (labs: 380, 395) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('labs')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="325" cy="398" rx="26" ry="8" fill="rgba(14,42,27,0.16)" />
        <polygon points="308,395 342,395 342,375 308,375" fill="#E0F2FE" />
        <polygon points="342,395 350,389 350,369 342,375" fill="#BAE6FD" />
        <polygon points="308,375 316,369 350,369 342,375" fill="#38BDF8" />
        {/* Lab Chimney / Vent Vents */}
        <rect x="314" y="363" width="4" height="6" fill="#64748B" rx="0.5" />
        <rect x="322" y="361" width="4" height="8" fill="#64748B" rx="0.5" />
        <circle cx="334" cy="385" r="4" fill="#0284C7" opacity="0.6" />
      </g>

      {/* 7. Sports Stadium & Field (field: 365, 485) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('field')}
      >
        {/* Red Athletic Running Track */}
        <ellipse cx="365" cy="485" rx="34" ry="24" fill="#EA580C" stroke="#FFFFFF" strokeWidth="1" opacity="0.85" />
        {/* Green Football Pitch */}
        <rect x="344" y="471" width="42" height="28" rx="3" fill="#15803D" stroke="#FFFFFF" strokeWidth="0.8" />
        <circle cx="365" cy="485" r="6" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
        <line x1="365" y1="471" x2="365" y2="499" stroke="#FFFFFF" strokeWidth="0.8" />
        {/* 3D Covered Grandstand Bleachers */}
        <polygon points="324,496 336,496 336,470 324,470" fill="#94A3B8" />
        <polygon points="324,470 330,466 342,466 336,470" fill="#E2E8F0" />
      </g>

      {/* 8. Peace Park Gazebo & Gardens (peace_park: 530, 255) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('peace_park')}
        filter="url(#bldg-shadow)"
      >
        {/* Garden Mound */}
        <ellipse cx="530" cy="225" rx="28" ry="12" fill="#86EFAC" opacity="0.6" />
        {/* Gazebo Pavilion Base */}
        <polygon points="520,224 540,224 544,216 536,210 516,210 512,216" fill="#FDFBF7" stroke="#CBD5E1" strokeWidth="0.5" />
        {/* 3D Pointed Pavilion Dome */}
        <polygon points="530,196 512,210 520,216" fill="#0A7D3E" />
        <polygon points="530,196 520,216 540,216" fill="#15803D" />
        <polygon points="530,196 540,216 548,210" fill="#0E2A1B" />
        <circle cx="530" cy="195" r="2.5" fill="#FFD23F" />
        {/* Flower Tufts */}
        <circle cx="510" cy="225" r="3" fill="#F472B6" />
        <circle cx="548" cy="223" r="3" fill="#FBBF24" />
        <circle cx="530" cy="232" r="3.5" fill="#F472B6" />
      </g>

      {/* 9. The Container Hub (container: 615, 320) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('container')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="645" cy="340" rx="26" ry="8" fill="rgba(14,42,27,0.18)" />
        {/* Bottom Turquoise Container */}
        <polygon points="628,338 658,338 658,324 628,324" fill="#0EA5E9" />
        <polygon points="658,338 666,332 666,318 658,324" fill="#0284C7" />
        <polygon points="628,324 636,318 666,318 658,324" fill="#38BDF8" />
        {/* Top Yellow/Orange Container (offset in 3D) */}
        <polygon points="636,322 662,322 662,310 636,310" fill="#F59E0B" />
        <polygon points="662,322 670,316 670,304 662,310" fill="#D97706" />
        <polygon points="636,310 644,304 670,304 662,310" fill="#FCD34D" />
      </g>

      {/* 10. Manna Dining Hall (manna: 665, 400) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('manna')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="700" cy="385" rx="30" ry="10" fill="rgba(14,42,27,0.18)" />
        {/* Dining Hall Facade */}
        <polygon points="682,382 720,382 720,362 682,362" fill="#FEF3C7" />
        <polygon points="720,382 730,375 730,355 720,362" fill="#FDE68A" />
        {/* Curved Vaulted Roof */}
        <path d="M680,362 Q701,346 722,362 L732,355 Q711,339 690,355 Z" fill="#EA580C" />
        {/* Large Dining Glass Windows */}
        <rect x="688" y="367" width="10" height="9" fill="#93C5FD" rx="1" />
        <rect x="704" y="367" width="10" height="9" fill="#93C5FD" rx="1" />
      </g>

      {/* 11. Health Centre (health_centre: 700, 490) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('health_centre')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="735" cy="492" rx="26" ry="8" fill="rgba(14,42,27,0.18)" />
        {/* Clinic Block */}
        <polygon points="720,490 752,490 752,472 720,472" fill="#FFFFFF" />
        <polygon points="752,490 760,484 760,466 752,472" fill="#CBD5E1" />
        <polygon points="720,472 728,466 760,466 752,472" fill="#F1F5F9" />
        {/* Red Medical Cross */}
        <rect x="733" y="475" width="6" height="2" fill="#EF4444" />
        <rect x="735" y="473" width="2" height="6" fill="#EF4444" />
        {/* Clinic Door */}
        <rect x="732" y="482" width="8" height="8" fill="#0EA5E9" rx="1" />
      </g>

      {/* 12. DP Residence Hall (dp: 700, 770) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('dp')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="700" cy="742" rx="36" ry="10" fill="rgba(14,42,27,0.2)" />
        {/* Multi-story Hall */}
        <polygon points="678,740 722,740 722,714 678,714" fill="#F8FAFC" />
        <polygon points="722,740 732,734 732,708 722,714" fill="#CBD5E1" />
        {/* Classical Columns */}
        <line x1="685" y1="740" x2="685" y2="718" stroke="#94A3B8" strokeWidth="2" />
        <line x1="695" y1="740" x2="695" y2="718" stroke="#94A3B8" strokeWidth="2" />
        <line x1="705" y1="740" x2="705" y2="718" stroke="#94A3B8" strokeWidth="2" />
        <line x1="715" y1="740" x2="715" y2="718" stroke="#94A3B8" strokeWidth="2" />
        {/* Terracotta Mansard Roof */}
        <polygon points="674,714 726,714 720,700 680,700" fill="#991B1B" />
        <polygon points="726,714 734,708 728,694 720,700" fill="#7F1D1D" />
      </g>

      {/* 13. Numbers Graveyard Monument Plaza (numbers_graveyard: 600, 622) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('numbers_graveyard')}
        filter="url(#bldg-shadow)"
      >
        {/* Memorial Plaza Stone Base */}
        <ellipse cx="600" cy="596" rx="26" ry="10" fill="#94A3B8" stroke="#FFFFFF" strokeWidth="1" />
        <ellipse cx="600" cy="593" rx="22" ry="8" fill="#E2E8F0" />
        {/* Monumental Stone Numbers (0, 7, 3, 9) */}
        <text x="590" y="595" fontSize="16" fontWeight="900" fill="#334155" fontFamily="monospace">7</text>
        <text x="600" y="593" fontSize="18" fontWeight="900" fill="#0A7D3E" fontFamily="monospace">0</text>
        <text x="610" y="596" fontSize="15" fontWeight="900" fill="#334155" fontFamily="monospace">3</text>
      </g>

      {/* 14. Food Mart (food_mart: 500, 626) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('food_mart')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="500" cy="658" rx="28" ry="9" fill="rgba(14,42,27,0.18)" />
        <polygon points="482,656 518,656 518,638 482,638" fill="#FFFBEB" />
        <polygon points="518,656 526,650 526,632 518,638" fill="#FDE68A" />
        {/* Green Storefront Awning */}
        <polygon points="480,644 520,644 520,638 480,638" fill="#15803D" />
        <polygon points="482,638 490,632 526,632 518,638" fill="#0A7D3E" />
        {/* Mart Entrance & Windows */}
        <rect x="495" y="646" width="10" height="10" fill="#0E2A1B" rx="1" />
        <circle cx="500" cy="630" r="3.5" fill="#FFD23F" />
      </g>

      {/* 15. BMS - Basic Medical Sciences (bms: 400, 632) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('bms')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="400" cy="604" rx="28" ry="9" fill="rgba(14,42,27,0.18)" />
        {/* Terracotta Academic Block */}
        <polygon points="384,602 416,602 416,584 384,584" fill="#FED7AA" />
        <polygon points="416,602 424,596 424,578 416,584" fill="#FDBA74" />
        <polygon points="384,584 392,578 424,578 416,584" fill="#C2762E" />
        {/* Faculty Windows */}
        <rect x="388" y="588" width="6" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="398" y="588" width="6" height="5" fill="#38BDF8" rx="0.5" />
        <rect x="408" y="588" width="6" height="5" fill="#38BDF8" rx="0.5" />
      </g>

      {/* 16. SEAP Faculty (seap: 300, 638) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('seap')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="300" cy="670" rx="28" ry="9" fill="rgba(14,42,27,0.18)" />
        <polygon points="284,668 316,668 316,648 284,648" fill="#F8FAFC" />
        <polygon points="316,668 324,662 324,642 316,648" fill="#CBD5E1" />
        <polygon points="284,648 292,642 324,642 316,648" fill="#475569" />
        <rect x="290" y="654" width="7" height="6" fill="#0284C7" rx="0.5" />
        <rect x="303" y="654" width="7" height="6" fill="#0284C7" rx="0.5" />
      </g>

      {/* 17. Engineering Faculty (engineering: 200, 644) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('engineering')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="200" cy="614" rx="30" ry="10" fill="rgba(14,42,27,0.2)" />
        {/* Modern Industrial Tech Hall */}
        <polygon points="182,612 218,612 218,592 182,592" fill="#E2E8F0" />
        <polygon points="218,612 226,606 226,586 218,592" fill="#94A3B8" />
        {/* Sawtooth Industrial Roof */}
        <polygon points="182,592 192,582 192,592" fill="#334155" />
        <polygon points="192,592 202,582 202,592" fill="#334155" />
        <polygon points="202,592 212,582 212,592" fill="#334155" />
        <polygon points="212,592 222,582 226,586 218,592" fill="#1E293B" />
        {/* Gear / Mechanical Badge */}
        <circle cx="200" cy="600" r="4.5" fill="#F59E0B" stroke="#0E2A1B" strokeWidth="0.8" />
      </g>

      {/* 18. Sapetro Building (sapetro: 100, 650) */}
      <g
        className="cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
        onClick={() => handleClick('sapetro')}
        filter="url(#bldg-shadow)"
      >
        <ellipse cx="100" cy="682" rx="30" ry="9" fill="rgba(14,42,27,0.2)" />
        {/* Glass Headquarters Complex */}
        <polygon points="84,680 116,680 116,654 84,654" fill="#BAE6FD" />
        <polygon points="116,680 124,674 124,648 116,654" fill="#0284C7" />
        <polygon points="84,654 92,648 124,648 116,654" fill="#0369A1" />
        {/* Reflective Grid */}
        <line x1="94" y1="654" x2="94" y2="680" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
        <line x1="104" y1="654" x2="104" y2="680" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
        <line x1="84" y1="666" x2="116" y2="666" stroke="#FFFFFF" strokeWidth="1" opacity="0.6" />
      </g>
    </g>
  );
}
