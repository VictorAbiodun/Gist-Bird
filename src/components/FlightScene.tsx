'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { SPOTS, getSpot, arcControl, arcPoint } from '@/lib/campus';
import { Icon } from './Icon';

interface FlightSceneProps {
  initialOrigin?: string | null;
  initialDest?: string | null;
  sentAt?: string | null;
  landsAt?: string | null;
  live?: boolean;
  onDelivered?: () => void;
  className?: string;
}

export function FlightScene({
  initialOrigin = 'gate',
  initialDest = 'chapel',
  sentAt,
  landsAt,
  live = false,
  onDelivered,
  className = '',
}: FlightSceneProps) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [fromSpot, setFromSpot] = useState<string>(initialOrigin || 'gate');
  const [toSpot, setToSpot] = useState<string>(initialDest || 'chapel');
  const [progress, setProgress] = useState<number>(0);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [flightSpeed, setFlightSpeed] = useState<number>(1);
  const [wingPhase, setWingPhase] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Ready for flight');
  const [delivered, setDelivered] = useState<boolean>(false);

  const reqRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const durationRef = useRef<number>(3000);

  const startSpot = getSpot(fromSpot) || getSpot('gate')!;
  const endSpot = getSpot(toSpot) || getSpot('chapel')!;

  const distance = Math.round(Math.hypot(endSpot.x - startSpot.x, endSpot.y - startSpot.y));
  const control = arcControl(startSpot, endSpot);
  const curveD = `M${startSpot.x},${startSpot.y} Q${control.x},${control.y} ${endSpot.x},${endSpot.y}`;

  // Current bird position along the curve
  const currentPos = arcPoint(startSpot, endSpot, progress);
  const altitude = Math.sin(progress * Math.PI); // 0 at takeoff, 1 at peak, 0 at landing

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0A7D3E', '#FFD23F', '#FF6B57', '#ffffff'],
      });
    } catch {
      /* ignore if canvas-confetti unsupported */
    }
  }, []);

  // Launch simulator flight
  const startFlight = useCallback((customDuration?: number) => {
    if (fromSpot === toSpot) {
      setStatusText('Pick two different spots on campus!');
      return;
    }
    setDelivered(false);
    setIsFlying(true);
    setProgress(0);
    startTimeRef.current = null;

    // Calculate duration based on distance and speed (min 2.5s, max 8s at 1x)
    const baseDuration = Math.max(2400, (distance / 120) * 1000);
    const ms = (customDuration || baseDuration) / flightSpeed;
    durationRef.current = ms;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const t = Math.min(1, elapsed / durationRef.current);

      setProgress(t);
      setWingPhase(timestamp / 75);

      if (t < 0.2) {
        setStatusText(`Chief Coo ascending from ${startSpot.name} 🛫`);
      } else if (t < 0.85) {
        setStatusText(`Cruising at altitude carrying your letter 💌`);
      } else if (t < 1) {
        setStatusText(`Descending towards ${endSpot.name} 🛬`);
      }

      if (t < 1) {
        reqRef.current = requestAnimationFrame(animate);
      } else {
        setIsFlying(false);
        setDelivered(true);
        setStatusText(`Paper delivered to ${endSpot.name}! 🎉`);
        triggerConfetti();
        if (onDelivered) onDelivered();
      }
    };

    reqRef.current = requestAnimationFrame(animate);
  }, [fromSpot, toSpot, distance, flightSpeed, startSpot.name, endSpot.name, triggerConfetti, onDelivered]);

  // Live progress handling when paper has actual timestamps
  useEffect(() => {
    if (!live || !sentAt || !landsAt) return;
    const s = new Date(sentAt).getTime();
    const l = new Date(landsAt).getTime();
    if (!(l > s)) {
      setProgress(1);
      setDelivered(true);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const p = Math.min(1, Math.max(0, (now - s) / (l - s)));
      setProgress(p);
      setWingPhase(Date.now() / 80);

      if (p >= 1) {
        setIsFlying(false);
        setDelivered(true);
        setStatusText(`Paper delivered to ${endSpot.name}! 🎉`);
        clearInterval(interval);
      } else {
        setIsFlying(true);
        const rem = Math.max(0, Math.round((l - now) / 1000));
        setStatusText(`In flight to ${endSpot.name} · ~${rem}s remaining`);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [live, sentAt, landsAt, endSpot.name]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, []);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top HUD Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border-[1.5px] border-line bg-surface p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon name="sent" size={16} />
          </span>
          <div>
            <p className="font-display text-label font-bold text-ink">
              {startSpot.name} <span className="text-muted">→</span> {endSpot.name}
            </p>
            <p className="text-caption text-muted">
              Distance: {distance} units · {delivered ? 'Delivered' : isFlying ? 'En route' : 'Ready'}
            </p>
          </div>
        </div>

        {/* 2D / 3D Perspective Toggle */}
        <div className="flex items-center gap-1.5 rounded-full border border-line bg-surface-alt p-1">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-bold transition-all ${
              viewMode === '3d'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            3D Aerial
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-bold transition-all ${
              viewMode === '2d'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-ink'
            }`}
          >
            2D Map
          </button>
        </div>
      </div>

      {/* 3D Perspective Viewport */}
      <div
        className="relative overflow-hidden rounded-2xl border-[1.5px] border-line bg-[#E3EEE6] p-2 shadow-inner"
        style={{ perspective: '1100px', perspectiveOrigin: '50% 35%' }}
      >
        {/* Subtle moving clouds in background */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-30">
          <div className="animate-cloud-drift-slow absolute -top-8 left-0 h-24 w-48 rounded-full bg-white/70 blur-xl" />
          <div className="animate-cloud-drift-fast absolute top-28 left-1/4 h-20 w-40 rounded-full bg-white/60 blur-lg" />
        </div>

        {/* Map Stage with 3D transform */}
        <div
          className="relative transition-transform duration-700 ease-out"
          style={{
            transform:
              viewMode === '3d'
                ? 'rotateX(26deg) rotateZ(-3deg) scale(0.97) translateY(-6px)'
                : 'rotateX(0deg) rotateZ(0deg) scale(1) translateY(0)',
            transformStyle: 'preserve-3d',
          }}
        >
          <svg
            viewBox="0 0 900 820"
            role="img"
            aria-label="Campus flight map"
            className="block h-auto w-full select-none"
          >
            <defs>
              {/* Ground Shadow Filter */}
              <filter id="bird-shadow-blur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation={3 + altitude * 6} />
              </filter>
              {/* Flight Path Glow */}
              <linearGradient id="flight-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A7D3E" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#FFD23F" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#FF6B57" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Base Campus Terrain */}
            <rect width="900" height="820" rx="16" fill="#E3EEE6" />
            
            {/* Campus landscape groves & decorative greenspaces */}
            <ellipse cx="140" cy="180" rx="90" ry="60" fill="#D3E6DA" opacity="0.8" />
            <ellipse cx="480" cy="230" rx="110" ry="70" fill="#D3E6DA" opacity="0.8" />
            <ellipse cx="640" cy="450" rx="80" ry="120" fill="#D3E6DA" opacity="0.8" />
            <ellipse cx="320" cy="630" rx="140" ry="50" fill="#D3E6DA" opacity="0.8" />
            <circle cx="365" cy="485" r="42" fill="#C5DFCE" /> {/* Field ring */}

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

            {/* Campus Road Network (from draft) */}
            <g id="roads" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Outer Road Casing */}
              <g stroke="#B9C7BF" strokeWidth="24">
                <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
                <polyline points="410,215 395,305 380,395 365,485" />
                <polyline points="700,620 100,650" />
              </g>
              {/* Inner White Road Surface */}
              <g stroke="#FFFFFF" strokeWidth="16">
                <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
                <polyline points="410,215 395,305 380,395 365,485" />
                <polyline points="700,620 100,650" />
              </g>
              {/* Center Dashes */}
              <g stroke="#CBD6CF" strokeWidth="2" strokeDasharray="6 6">
                <polyline points="70,110 180,150 290,185 410,215 530,255 615,320 665,400 700,490 700,620 700,770" />
                <polyline points="410,215 395,305 380,395 365,485" />
                <polyline points="700,620 100,650" />
              </g>
            </g>

            {/* Road Annotations */}
            <text x="715" y="705" fontSize="12" fill="#5B6770" fontWeight="500">
              very long straight road
            </text>
            <text x="715" y="640" fontSize="12" fill="#5B6770" fontWeight="500">
              T-junction
            </text>

            {/* Flight Trail (Curved Bézier Arc) */}
            <path
              d={curveD}
              fill="none"
              stroke="#0A7D3E"
              strokeWidth="3.5"
              strokeDasharray="6 8"
              opacity="0.4"
            />
            {/* Glowing Active Trail */}
            <path
              d={curveD}
              fill="none"
              stroke="url(#flight-glow)"
              strokeWidth="4.5"
              strokeDasharray="8 6"
              className="animate-pulse"
              opacity="0.8"
            />

            {/* Campus Landmark Nodes */}
            {SPOTS.map((s) => {
              const isStart = s.id === fromSpot;
              const isEnd = s.id === toSpot;
              const isFaculty = s.kind === 'faculty';
              const dotColor = isStart ? '#0A7D3E' : isEnd ? '#FF6B57' : isFaculty ? '#C2762E' : '#2F5D50';
              const isSpecial = isStart || isEnd;

              return (
                <g
                  key={s.id}
                  onClick={() => {
                    if (isFlying) return;
                    if (!fromSpot || (fromSpot && toSpot)) {
                      setFromSpot(s.id);
                      setToSpot('');
                    } else {
                      setToSpot(s.id);
                    }
                  }}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  role="button"
                  tabIndex={0}
                  aria-label={s.name}
                >
                  {/* Outer Pulsing Beacon for Origin & Destination */}
                  {isStart && (
                    <circle cx={s.x} cy={s.y} r="18" fill="none" stroke="#0A7D3E" strokeWidth="2.5" className="animate-ping" opacity="0.6" />
                  )}
                  {isEnd && (
                    <circle cx={s.x} cy={s.y} r="20" fill="none" stroke="#FF6B57" strokeWidth="2.5" className="animate-ping" opacity="0.6" />
                  )}

                  {/* Ring */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={isSpecial ? 15 : 12}
                    fill={isSpecial ? '#FFFFFF' : 'none'}
                    stroke={isSpecial ? dotColor : '#B9C7BF'}
                    strokeWidth={isSpecial ? 3 : 1.5}
                  />

                  {/* Inner Dot */}
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={isSpecial ? 9 : isFaculty ? 7 : 8}
                    fill={dotColor}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />

                  {/* Landmark Label */}
                  {s.kind !== 'junction' && (
                    <text
                      x={s.x}
                      y={s.y + (s.y > 500 ? 24 : -16)}
                      textAnchor="middle"
                      fontSize={isSpecial ? '14' : '12'}
                      fontWeight={isSpecial ? '800' : '600'}
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

            {/* Delivered Letter Badge (Pops on destination when landed) */}
            {delivered && (
              <g transform={`translate(${endSpot.x}, ${endSpot.y})`} className="animate-bounce">
                <circle cx="0" cy="0" r="16" fill="#FFD23F" stroke="#0A7D3E" strokeWidth="2.5" />
                {/* Envelope */}
                <rect x="-8" y="-5" width="16" height="11" rx="1.5" fill="#FFFFFF" stroke="#0E2A1B" strokeWidth="1" />
                <path d="M-8,-5 L0,2 L8,-5" fill="none" stroke="#0A7D3E" strokeWidth="1.2" />
                <circle cx="0" cy="1" r="2" fill="#FF6B57" />
              </g>
            )}

            {/* Dynamic Ground Shadow (elevates and blurs in 3D mid-flight) */}
            <ellipse
              cx={currentPos.x + 8 * altitude}
              cy={currentPos.y + 14 * altitude}
              rx={16 + 14 * altitude}
              ry={9 + 8 * altitude}
              fill="rgba(14, 42, 27, 0.45)"
              filter="url(#bird-shadow-blur)"
              opacity={0.45 - altitude * 0.2}
            />

            {/* Flying Chief Coo (Mix of 2D & 3D Flight) */}
            <g
              transform={`translate(${currentPos.x}, ${currentPos.y - altitude * 42}) rotate(${currentPos.angle}) scale(${1 + altitude * 0.25})`}
              className="transition-transform duration-75 ease-linear"
            >
              {/* Fluttering Scarf / Streamer */}
              <path
                d={`M-14,3 C-22,${5 + Math.sin(wingPhase) * 6} -28,${2 - Math.cos(wingPhase) * 8} -36,${4 + Math.sin(wingPhase) * 5}`}
                fill="none"
                stroke="#0A7D3E"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d={`M-14,5 C-20,${8 + Math.cos(wingPhase) * 5} -26,${6 - Math.sin(wingPhase) * 7} -34,${7 + Math.cos(wingPhase) * 4}`}
                fill="none"
                stroke="#FFD23F"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Chief Coo Body */}
              <circle cx="0" cy="0" r="15" fill="#7F90A3" stroke="#0E2A1B" strokeWidth="2" />
              {/* Belly */}
              <ellipse cx="2" cy="4" rx="9" ry="8" fill="#DCE5ED" />

              {/* Aviator Sunglasses / Goggles */}
              <rect x="1" y="-5" width="12" height="7" rx="3" fill="#0E2A1B" />
              <line x1="3" y1="-3" x2="6" y2="-1" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="8" y1="-3" x2="11" y2="-1" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />

              {/* Orange Beak */}
              <polygon points="12,-2 20,1 12,4" fill="#FF8A3D" stroke="#0E2A1B" strokeWidth="1" />

              {/* Flapping Wings (Left & Right) with Sinusoidal Wing Flap */}
              <g transform={`scale(1, ${0.5 + 0.5 * Math.abs(Math.sin(wingPhase))})`}>
                {/* Upper Wing */}
                <path
                  d="M-4,-4 C-10,-18 -22,-20 -28,-10 C-18,-11 -10,-7 -2,0 Z"
                  fill="#5A6D80"
                  stroke="#0E2A1B"
                  strokeWidth="1.5"
                />
                {/* Lower Wing */}
                <path
                  d="M-4,4 C-10,18 -22,20 -28,10 C-18,11 -10,7 -2,0 Z"
                  fill="#5A6D80"
                  stroke="#0E2A1B"
                  strokeWidth="1.5"
                />
              </g>

              {/* Carried Letter (Envelope with Wax Seal in Talons) */}
              <g transform="translate(-2, 10) rotate(-5)">
                <rect x="-8" y="-5" width="16" height="11" rx="1.5" fill="#FFFBEB" stroke="#0E2A1B" strokeWidth="1.2" />
                <path d="M-8,-5 L0,1 L8,-5" fill="none" stroke="#0A7D3E" strokeWidth="1.2" />
                {/* Wax Seal */}
                <circle cx="0" cy="0.5" r="2.2" fill="#FF6B57" />
              </g>

              {/* Speed Wind Streaks */}
              {isFlying && (
                <g stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
                  <line x1="-32" y1="-8" x2="-44" y2="-8" strokeDasharray="4 4" />
                  <line x1="-30" y1="12" x2="-46" y2="12" strokeDasharray="4 4" />
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Flight Progress HUD */}
      <div className="space-y-2 rounded-card border-[1.5px] border-line bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between text-body font-bold">
          <p className="flex items-center gap-2">
            <span className="text-xl">{delivered ? '💌' : '🪶'}</span>
            <span>{statusText}</span>
          </p>
          <span className="rounded-full bg-lemon px-2.5 py-0.5 text-label font-bold text-ink">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Animated Progress Bar */}
        <div
          className="relative h-2.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        {/* Simulator Controls & Spot Selectors (matches user draft) */}
        <div className="mt-4 border-t border-line/60 pt-3">
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-caption font-semibold text-muted">From spot</label>
              <select
                value={fromSpot}
                disabled={isFlying}
                onChange={(e) => {
                  setFromSpot(e.target.value);
                  setProgress(0);
                  setDelivered(false);
                }}
                className="w-full rounded-input border-[1.5px] border-line bg-surface px-3 py-2 text-label font-bold text-ink focus:border-primary focus:outline-none"
              >
                {SPOTS.filter((s) => s.kind !== 'junction').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[130px]">
              <label className="mb-1 block text-caption font-semibold text-muted">To spot</label>
              <select
                value={toSpot}
                disabled={isFlying}
                onChange={(e) => {
                  setToSpot(e.target.value);
                  setProgress(0);
                  setDelivered(false);
                }}
                className="w-full rounded-input border-[1.5px] border-line bg-surface px-3 py-2 text-label font-bold text-ink focus:border-primary focus:outline-none"
              >
                {SPOTS.filter((s) => s.kind !== 'junction').map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startFlight()}
                disabled={isFlying}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-btn bg-primary px-4 text-label font-bold text-white transition active:scale-95 disabled:opacity-50"
              >
                <Icon name="sent" size={16} />
                {delivered ? 'Fly Again' : isFlying ? 'Flying…' : 'Send Bird'}
              </button>

              <select
                value={flightSpeed}
                onChange={(e) => setFlightSpeed(Number(e.target.value))}
                className="rounded-input border-[1.5px] border-line bg-surface px-2.5 py-1.5 text-caption font-bold text-muted focus:border-primary"
                title="Animation Speed"
              >
                <option value={1}>1x Speed</option>
                <option value={2}>2x Speed</option>
                <option value={4}>4x Turbo</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
