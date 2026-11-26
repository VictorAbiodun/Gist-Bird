export default function SentLoading() {
  return (
    <main>
      <header className="flex items-center gap-3 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="flex-1 font-display text-[24px] font-bold text-ink">Sent</h1>
      </header>
      <ul className="space-y-3 px-5 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2 rounded-card border-[1.5px] border-line bg-surface p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-line/50" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-7 w-20 animate-pulse rounded-full bg-surface-alt" />
              <div className="h-3 w-14 animate-pulse rounded bg-line/50" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
