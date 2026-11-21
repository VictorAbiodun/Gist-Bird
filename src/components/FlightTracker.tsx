'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Notice, LinkButton } from './ui';
import { FlightScene } from './FlightScene';
import { getSpot } from '@/lib/campus';

export function FlightTracker({
  origin,
  dest,
  sentAt,
  landsAt,
  birdName = 'Chief Coo',
  birdLevel = 1,
  speedBoostPercent = 0,
}: {
  origin: string;
  dest: string | null;
  sentAt: string;
  landsAt: string;
  birdName?: string;
  birdLevel?: number;
  speedBoostPercent?: number;
}) {
  const router = useRouter();
  const [delivered, setDelivered] = useState(false);
  const o = getSpot(origin);
  const d = getSpot(dest);

  return (
    <div className="space-y-4 px-5">
      <FlightScene
        initialOrigin={origin}
        initialDest={dest || 'chapel'}
        sentAt={sentAt}
        landsAt={landsAt}
        live={true}
        birdName={birdName}
        birdLevel={birdLevel}
        speedBoostPercent={speedBoostPercent}
        onDelivered={() => {
          setDelivered(true);
          setTimeout(() => router.refresh(), 2000);
        }}
      />

      <Card className="space-y-2">
        <p className="font-display text-heading font-bold">
          {delivered ? 'Paper Don Land! 💌' : `${birdName} dey carry your gist`}
        </p>
        <p className="text-label text-muted">
          From {o?.name ?? 'Campus'} to {d?.name ?? 'Campus'}
        </p>
      </Card>

      {delivered ? (
        <div className="space-y-2 pt-2">
          <Notice tone="ok" title="Safe delivery">
            Your paper has reached its destination. Someone will read it soon!
          </Notice>
          <div className="flex gap-2">
            <LinkButton href="/write" variant="primary" className="flex-1">
              Write another paper
            </LinkButton>
            <LinkButton href="/home" variant="outline" className="flex-1">
              Back home
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="space-y-2 pt-2">
          <Notice title="No need to wait here">
            {birdName} knows the route. You can close the app — we will notify you the moment it lands!
          </Notice>
          <LinkButton href="/home" variant="outline" className="w-full">
            Back home
          </LinkButton>
        </div>
      )}
    </div>
  );
}
