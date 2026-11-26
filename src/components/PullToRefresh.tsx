'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 70;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || (containerRef.current?.scrollTop ?? 0);
    if (scrollTop > 2) return;
    startY.current = e.touches[0].clientY;
    setPulling(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.4, 100));
      }
    },
    [pulling, refreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (!pulling) return;
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      router.refresh();
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }, 1000);
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pulling, pullDistance, refreshing, router]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {pullDistance > 0 && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex justify-center"
          style={{ height: pullDistance }}
        >
          <div
            className={`mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface shadow-sm ${
              refreshing ? 'animate-spin' : ''
            }`}
          >
            <svg
              className="h-4 w-4 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" />
            </svg>
          </div>
        </div>
      )}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling && pullDistance === 0 ? 'transform 0.2s' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
