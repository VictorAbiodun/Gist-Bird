import { Header } from '@/components/ui';
import { VerifyForm } from '@/components/AuthForms';

const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, '$1***$2');

export default function VerifyPage({ searchParams }: { searchParams: { email?: string; demo_code?: string } }) {
  const email = searchParams.email ?? '';
  const demoCode = searchParams.demo_code;
  return (
    <main>
      <Header back="/email" />
      <div className="space-y-4 px-5 pt-2">
        <h1 className="text-[28px] leading-[34px]">Check your email</h1>
        <p className="text-muted">We sent a verification code to {mask(email)}.</p>
        {demoCode && (
          <div className="rounded-card border-[1.5px] border-primary/40 bg-surface-alt p-3.5 text-label">
            <p className="font-bold text-primary">Testing Sandbox Active</p>
            <p className="mt-1 text-ink">
              Because Resend free tier sends only to the account owner (<code>uchihavictor593@gmail.com</code>), the code was routed to your admin email and auto-filled below:
            </p>
            <p className="mt-2 font-display text-[22px] font-bold tracking-widest text-primary">
              {demoCode}
            </p>
          </div>
        )}
        <VerifyForm email={email} defaultToken={demoCode} />
      </div>
    </main>
  );
}
