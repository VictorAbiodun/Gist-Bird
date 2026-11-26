export default function ChatsLoading() {
  return (
    <main>
      <header className="flex items-center gap-3 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="flex-1 font-display text-[24px] font-bold text-ink">Chats</h1>
      </header>
      <ul className="space-y-3 px-5 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-card border-[1.5px] border-line bg-surface p-3.5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-surface-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-surface-alt" />
              <div className="h-3 w-40 animate-pulse rounded bg-line/50" />
            </div>
            <div className="h-3 w-10 animate-pulse rounded bg-line/50" />
          </li>
        ))}
      </ul>
    </main>
  );
}
