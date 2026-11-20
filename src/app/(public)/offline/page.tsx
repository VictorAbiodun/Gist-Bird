import { Mascot } from '@/components/Mascot';
import { LinkButton } from '@/components/ui';

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-12 text-center">
      <Mascot pose="curious" size={200} priority />
      <h1 className="mt-4 text-[28px] font-bold text-ink">You are offline</h1>
      <p className="mt-2 max-w-xs text-muted">
        Looks like campus Wi-Fi or mobile data dipped. Check your connection to send or read gists.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <LinkButton href="/home" className="w-full">Try again</LinkButton>
      </div>
    </main>
  );
}
