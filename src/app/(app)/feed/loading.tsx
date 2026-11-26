export default function FeedLoading() {
  return (
    <main className="min-h-[calc(100dvh-88px)] bg-bg">
      <div className="border-b border-line bg-surface px-4 pb-2.5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="h-7 w-16 animate-pulse rounded-lg bg-surface-alt" />
          <div className="h-8 w-28 animate-pulse rounded-full bg-primary/20" />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <div className="h-8 flex-1 animate-pulse rounded-full bg-surface-alt" />
          <div className="h-8 flex-1 animate-pulse rounded-full bg-surface-alt" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-surface-alt" />
        </div>
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 bg-surface p-4">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-alt" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-surface-alt" />
              <div className="h-3.5 w-full animate-pulse rounded bg-line/50" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-line/50" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
