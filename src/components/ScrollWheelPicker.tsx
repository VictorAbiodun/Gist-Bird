'use client';

import { useEffect, useRef, useState } from 'react';
import { calculateAgeFromDob, formatAgeDob } from '@/lib/universities';

export interface WheelOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

interface ScrollWheelPickerProps {
  options: WheelOption[];
  value: string;
  onChange: (value: string) => void;
  itemHeight?: number;
  visibleCount?: number;
  className?: string;
}

export function ScrollWheelPicker({
  options,
  value,
  onChange,
  itemHeight = 46,
  visibleCount = 5,
  className = '',
}: ScrollWheelPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const pad = Math.floor(visibleCount / 2) * itemHeight;
  const totalHeight = visibleCount * itemHeight;
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scroll position when value changes externally (e.g. search or mount)
  useEffect(() => {
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === value)
    );
    const el = containerRef.current;
    if (el) {
      const targetTop = idx * itemHeight;
      if (Math.abs(el.scrollTop - targetTop) > 2) {
        el.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
      setScrollTop(targetTop);
    }
  }, [value, options, itemHeight]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const top = el.scrollTop;
    setScrollTop(top);

    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const idx = Math.min(options.length - 1, Math.max(0, Math.round(top / itemHeight)));
      const opt = options[idx];
      if (opt && opt.value !== value) {
        onChange(opt.value);
      }
    }, 80);
  };

  const snapTo = (idx: number) => {
    const el = containerRef.current;
    const opt = options[idx];
    if (el) {
      el.scrollTo({ top: idx * itemHeight, behavior: 'smooth' });
    }
    if (opt && opt.value !== value) {
      onChange(opt.value);
    }
  };

  return (
    <div
      className={`relative select-none overflow-hidden rounded-[20px] border border-line bg-surface ${className}`}
      style={{ height: totalHeight }}
    >
      {/* Top & bottom fade masks */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 bg-gradient-to-b from-surface via-surface/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t from-surface via-surface/80 to-transparent" />

      {/* Center highlight bar */}
      <div
        className="pointer-events-none absolute inset-x-2.5 z-0 rounded-[12px] border border-primary/25 bg-surface-alt/70"
        style={{ top: pad, height: itemHeight }}
      />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scrollbar-none"
        style={{ paddingTop: pad, paddingBottom: pad }}
      >
        {options.map((opt, idx) => {
          const centerOffset = (idx * itemHeight - scrollTop) / itemHeight;
          const absDist = Math.min(2.5, Math.abs(centerOffset));
          const scale = 1 - absDist * 0.06;
          const opacity = Math.max(0.28, 1 - absDist * 0.28);
          const isActive = absDist < 0.45;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => snapTo(idx)}
              className="flex w-full snap-center items-center justify-center gap-2 px-3 text-center transition-transform duration-75"
              style={{
                height: itemHeight,
                transform: `scale(${scale})`,
                opacity,
              }}
            >
              {opt.icon}
              <span
                className={`truncate font-display text-[15px] ${
                  isActive ? 'font-bold text-ink' : 'font-medium text-muted'
                }`}
              >
                {opt.label}
              </span>
              {opt.sublabel && (
                <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-[10px] font-bold text-muted">
                  {opt.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const MONTHS = [
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

const DAYS: WheelOption[] = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1).padStart(2, '0'),
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: WheelOption[] = Array.from({ length: 42 }, (_, i) => {
  const y = CURRENT_YEAR - 15 - i;
  return { value: String(y), label: String(y) };
});

interface DateOfBirthWheelPickerProps {
  initialAgeStr?: string | null;
  onChange: (formattedAgeDob: string) => void;
}

function parseInitialDob(ageStr?: string | null): { day: number; month: number; year: number } {
  if (ageStr) {
    const m = ageStr.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/);
    if (m) {
      return {
        day: parseInt(m[1], 10),
        month: parseInt(m[2], 10),
        year: parseInt(m[3], 10),
      };
    }
  }
  return { day: 15, month: 6, year: 2005 };
}

export function DateOfBirthWheelPicker({ initialAgeStr, onChange }: DateOfBirthWheelPickerProps) {
  const initial = parseInitialDob(initialAgeStr);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  const updateDob = (d: number, m: number, y: number) => {
    const maxDays = new Date(y, m, 0).getDate();
    const clampedDay = Math.min(d, maxDays);
    setDay(clampedDay);
    setMonth(m);
    setYear(y);
    onChange(formatAgeDob(clampedDay, m, y));
  };

  const age = calculateAgeFromDob(day, month, year);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-[16px] bg-surface-alt px-4 py-2.5">
        <span className="text-label font-semibold text-muted">Calculated Age</span>
        <span className="font-display text-[17px] font-bold text-primary">
          {age} years old ({String(day).padStart(2, '0')}/{String(month).padStart(2, '0')}/{year})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="mb-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
            Day
          </p>
          <ScrollWheelPicker
            options={DAYS}
            value={String(day)}
            onChange={(val) => updateDob(parseInt(val, 10), month, year)}
            visibleCount={5}
            itemHeight={42}
          />
        </div>
        <div>
          <p className="mb-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
            Month
          </p>
          <ScrollWheelPicker
            options={MONTHS}
            value={String(month)}
            onChange={(val) => updateDob(day, parseInt(val, 10), year)}
            visibleCount={5}
            itemHeight={42}
          />
        </div>
        <div>
          <p className="mb-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
            Year
          </p>
          <ScrollWheelPicker
            options={YEARS}
            value={String(year)}
            onChange={(val) => updateDob(day, month, parseInt(val, 10))}
            visibleCount={5}
            itemHeight={42}
          />
        </div>
      </div>
    </div>
  );
}
