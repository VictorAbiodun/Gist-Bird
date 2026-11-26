export default function MeLoading() {
  return (
    <main className="min-h-dvh bg-bg">
      <div className="bg-surface-alt px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-surface/60" />
          <div className="flex gap-2">
            <div className="h-10 w-16 animate-pulse rounded-full bg-surface/60" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface/60" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface/60" />
          </div>
        </div>
      </div>
      <div className="relative -mt-8 rounded-t-[28px] bg-bg px-5">
        <div className="flex justify-center">
          <div className="-mt-12 h-[100px] w-[100px] animate-pulse rounded-full border-4 border-surface bg-surface-alt" />
        </div>
        <div className="mt-3 space-y-3">
          <div className="mx-auto h-5 w-24 animate-pulse rounded bg-surface-alt" />
          <div className="h-20 w-full animate-pulse rounded-[20px] bg-surface-alt" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-surface-alt" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
