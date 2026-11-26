'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useSpring, useTransform, useVelocity } from 'framer-motion';
import { Icon, type IconName } from './Icon';

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/sent', label: 'Sent', icon: 'sent' },
  { href: '/chats', label: 'Chats', icon: 'chat' },
  { href: '/me', label: 'Me', icon: 'me' },
];

const HIDE = ['/chat/', '/write', '/flight/', '/paper/', '/report', '/me/edit', '/settings/'];

export function TabBar({ inbox = 0, chats = 0 }: { inbox?: number; chats?: number }) {
  const path = usePathname();
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => path === t.href || path.startsWith(t.href + '/'))
  );

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number>(activeIndex);

  const dragStateRef = useRef<{
    active: boolean;
    scrubbing: boolean;
    startX: number;
    pointerId: number | null;
    lastTickIdx: number;
  }>({
    active: false,
    scrubbing: false,
    startX: 0,
    pointerId: null,
    lastTickIdx: activeIndex,
  });

  const suppressClickRef = useRef(false);

  // Smooth spring-driven pill position in percentage (0%, 100%, 200%, 300% of 1 tab width)
  const pillX = useSpring(activeIndex * 100, {
    stiffness: 400,
    damping: 30,
    mass: 0.7,
  });
  const pillXPercent = useTransform(pillX, (v) => `${v}%`);

  // Velocity-driven liquid stretch & squish (water droplet physics)
  const pillVelocity = useVelocity(pillX);
  const rawScaleX = useTransform(pillVelocity, [-1200, 0, 1200], [1.22, 1, 1.22]);
  const rawScaleY = useTransform(pillVelocity, [-1200, 0, 1200], [0.88, 1, 0.88]);
  const liquidScaleX = useSpring(rawScaleX, { stiffness: 480, damping: 26 });
  const liquidScaleY = useSpring(rawScaleY, { stiffness: 480, damping: 26 });

  useEffect(() => {
    if (!isScrubbing) {
      pillX.set(activeIndex * 100);
      setScrubIndex(activeIndex);
    }
  }, [activeIndex, isScrubbing, pillX]);

  if (HIDE.some((h) => path.startsWith(h))) return null;

  const getTabMetrics = (clientX: number) => {
    const el = listRef.current;
    if (!el) return { continuousPct: activeIndex * 100, idx: activeIndex };
    const rect = el.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = relX / rect.width; // 0 .. 1
    const continuousIdx = Math.max(0, Math.min(TABS.length - 1, ratio * TABS.length - 0.5));
    const idx = Math.max(0, Math.min(TABS.length - 1, Math.floor(ratio * TABS.length)));
    return { continuousPct: continuousIdx * 100, idx };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLUListElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    dragStateRef.current = {
      active: true,
      scrubbing: false,
      startX: e.clientX,
      pointerId: e.pointerId,
      lastTickIdx: activeIndex,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLUListElement>) => {
    const st = dragStateRef.current;
    if (!st.active) return;

    const dx = Math.abs(e.clientX - st.startX);
    if (!st.scrubbing && dx > 6) {
      st.scrubbing = true;
      setIsScrubbing(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore if capture fails
      }
    }

    if (st.scrubbing) {
      const { continuousPct, idx } = getTabMetrics(e.clientX);
      pillX.set(continuousPct);
      if (idx !== st.lastTickIdx) {
        st.lastTickIdx = idx;
        setScrubIndex(idx);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(6);
        }
      }
    }
  };

  const finishScrub = (e: React.PointerEvent<HTMLUListElement>) => {
    const st = dragStateRef.current;
    if (!st.active) return;

    const wasScrubbing = st.scrubbing;
    const { idx } = getTabMetrics(e.clientX);

    dragStateRef.current = {
      active: false,
      scrubbing: false,
      startX: 0,
      pointerId: null,
      lastTickIdx: idx,
    };

    if (wasScrubbing) {
      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 80);

      setIsScrubbing(false);
      pillX.set(idx * 100);
      const target = TABS[idx];
      if (target && target.href !== path && !path.startsWith(target.href + '/')) {
        router.push(target.href);
      }
    }
  };

  const highlightedIndex = isScrubbing ? scrubIndex : activeIndex;

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
    >
      <ul
        ref={listRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishScrub}
        onPointerCancel={finishScrub}
        onClickCapture={(e) => {
          if (suppressClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        style={{ touchAction: 'none' }}
        className="relative flex select-none"
      >
        {/* Clear Liquid-Glass Droplet Pill */}
        <motion.div
          aria-hidden="true"
          style={{ x: pillXPercent }}
          className="pointer-events-none absolute inset-y-1.5 left-0 w-1/4 px-1.5"
        >
          <motion.div
            style={{
              scaleX: liquidScaleX,
              scaleY: liquidScaleY,
            }}
            animate={{
              scale: isScrubbing ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="relative h-full w-full overflow-hidden rounded-[22px] border border-white/70 bg-white/30 backdrop-blur-[10px] dark:border-white/25 dark:bg-white/10"
          >
            <div
              className="absolute inset-0 rounded-[22px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.12) 45%, rgba(10,125,62,0.06) 100%)',
                boxShadow: isScrubbing
                  ? 'inset 0 1.5px 1.5px rgba(255,255,255,0.95), inset 0 -1.5px 3px rgba(255,255,255,0.4), 0 8px 22px rgba(10,125,62,0.16), 0 2px 6px rgba(0,0,0,0.08)'
                  : 'inset 0 1.5px 1px rgba(255,255,255,0.85), inset 0 -1px 2px rgba(255,255,255,0.3), 0 3px 12px rgba(10,125,62,0.1), 0 1px 3px rgba(0,0,0,0.05)',
              }}
            />
          </motion.div>
        </motion.div>

        {TABS.map((t, idx) => {
          const active = idx === highlightedIndex;
          return (
            <li key={t.href} className="relative z-10 flex-1">
              <Link
                href={t.href}
                prefetch={true}
                draggable={false}
                aria-current={idx === activeIndex ? 'page' : undefined}
                className={`relative flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-caption transition-colors duration-150 ${
                  active ? 'font-bold text-primary' : 'font-semibold text-muted'
                } ${isScrubbing && active ? 'scale-105' : 'active:scale-95'} transition-transform duration-150`}
              >
                <Icon name={t.icon} />
                {t.label}
                {t.href === '/home' && inbox > 0 && (
                  <span className="absolute right-[28%] top-1.5 rounded-full bg-danger px-1.5 text-[11px] font-bold leading-4 text-white">
                    {inbox}
                  </span>
                )}
                {t.href === '/chats' && chats > 0 && (
                  <span className="absolute right-[28%] top-1.5 rounded-full bg-danger px-1.5 text-[11px] font-bold leading-4 text-white">
                    {chats}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
