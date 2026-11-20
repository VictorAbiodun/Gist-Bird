'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampusMap } from './CampusMap';
import { Card, Notice, LinkButton } from './ui';
import { flightProgress, getSpot, nearestLandmarkAlong } from '@/lib/campus';

const fmt = (s: number) => (s < 90 ? `${Math.max(5, Math.round(s / 5) * 5)} seconds` : `${Math.round(s / 60)} min`);

export function FlightTracker({ origin, dest, sentAt, landsAt }: { origin: string; dest: string | null; sentAt: string; landsAt: string }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const refreshed = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const t = flightProgress(sentAt, landsAt, now);
  useEffect(() => { if (t >= 1 && !refreshed.current) { refreshed.current = true; setTimeout(() => router.refresh(), 1200); } }, [t, router]);

  const total = (new Date(landsAt).getTime() - new Date(sentAt).getTime()) / 1000;
  const remaining = Math.max(0, (new Date(landsAt).getTime() - now) / 1000);
  const o = getSpot(origin), d = getSpot(dest);
  const rest = dest && total > 180 && t > 0.15 && t < 0.9 ? nearestLandmarkAlong(origin, dest, t) : undefined;

  return (
    <div className="space-y-4 px-5">
      <CampusMap arc={dest ? { from: origin, to: dest, t } : null} label="Chief Coo flying across campus" />
      <Card className="space-y-2">
        <p className="font-display text-heading font-bold">{rest ? `Chief Coo is resting at ${rest.name}` : 'Chief Coo dey carry am'}</p>
        <p className="text-label text-muted">
          {d ? `${o?.name} to ${d.name} · ` : `From ${o?.name} · `}{t >= 1 ? 'landing now' : `about ${fmt(remaining)}`}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(t * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Flight progress">
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${Math.round(t * 100)}%` }} />
        </div>
      </Card>
      <Notice title={total > 180 ? 'No need to wait here' : 'You can close the app'}>We will send a notification the moment it lands.</Notice>
      <LinkButton href="/home" variant="outline" className="w-full">Back home</LinkButton>
    </div>
  );
}
