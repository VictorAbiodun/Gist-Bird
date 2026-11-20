import { Mascot } from '@/components/Mascot';
import { LinkButton } from '@/components/ui';
import Link from 'next/link';

export default function Welcome() {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 pb-8 pt-16 text-center">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <Mascot pose="wave" size={260} priority />
        <h1 className="text-[44px] leading-[50px] text-primary">Gist Bird</h1>
        <p className="max-w-[18rem] text-heading text-muted">Say something real. Meet someone new.</p>
      </div>
      <div className="w-full space-y-3">
        <LinkButton href="/email" className="w-full">Get started</LinkButton>
        <p className="text-label text-muted">Verified students only · <Link href="/rules" className="font-semibold text-primary underline">Our rules</Link></p>
      </div>
    </main>
  );
}
