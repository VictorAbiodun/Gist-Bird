export default function HomeLoading() {
  return (
    <main className="relative min-h-[calc(100dvh-88px)] overflow-hidden bg-surface-alt">
      <div className="flex items-center gap-2 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-primary/20" />
        <div className="flex-1" />
        <div className="h-9 w-16 animate-pulse rounded-full bg-surface" />
        <div className="h-9 w-16 animate-pulse rounded-full bg-surface" />
        <div className="h-11 w-11 animate-pulse rounded-full bg-surface" />
      </div>
      <div className="flex flex-col items-center justify-center gap-4 px-8 pt-24">
        <div className="h-40 w-40 animate-pulse rounded-full bg-surface/60" />
        <div className="h-4 w-48 animate-pulse rounded-full bg-surface/80" />
      </div>
      <div className="absolute bottom-6 left-0 right-0 space-y-3 px-5">
        <div className="h-14 w-full animate-pulse rounded-btn bg-primary/30" />
      </div>
    </main>
  );
}
