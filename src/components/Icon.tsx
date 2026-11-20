const PATHS: Record<string, React.ReactNode> = {
  back: <path d="M15 18l-6-6 6-6" />, check: <path d="M5 12l5 5 9-10" />, close: <path d="M6 6l12 12M18 6L6 18" />,
  flag: <path d="M4 22V4M4 4h13l-2 4 2 4H4" />, info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v.5M12 11.5v5" /></>,
  bell: <><path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 004 0" /></>,
  map: <><path d="M12 21s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  inbox: <><path d="M3 13l3-8h12l3 8v6H3z" /><path d="M3 13h5l1 3h6l1-3h5" /></>,
  sent: <><path d="M21 3L10 14" /><path d="M21 3l-7 18-4-7-7-4z" /></>,
  me: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />, home: <path d="M3 11l9-8 9 8v10H3z" />,
  chev: <path d="M9 6l6 6-6 6" />, more: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />, wifi: <path d="M2 8c5-4 15-4 20 0M5 12c4-3 10-3 14 0M9 16c2-1.5 4-1.5 6 0M3 3l18 18" />,
  pen: <path d="M4 20l4-1 11-11-3-3L5 16z" />, shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  heart: <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 10c0 6-8 11-8 11z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
};
export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {PATHS[name]}
    </svg>
  );
}
