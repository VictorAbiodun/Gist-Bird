export default function NotificationsLoading() {
  return (
    <main>
      <header className="flex items-center gap-3 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-line bg-surface" />
        <h1 className="flex-1 font-display text-[24px] font-bold text-ink">Notifications</h1>
      </header>
      <ul className="space-y-2.5 px-5 pt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5">
            <div className="mt-1 h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-alt" />
              <div className="h-3 w-48 animate-pulse rounded bg-line/50" />
            </div>
            <div className="h-3 w-10 animate-pulse rounded bg-line/50" />
          </li>
        ))}
      </ul>
    </main>
  );
}
