import { Header } from '@/components/ui';
import { VerifyForm } from '@/components/AuthForms';

const mask = (e: string) => e.replace(/^(.{2}).*(@.*)$/, '$1***$2');

export default function VerifyPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email ?? '';
  return (
    <main>
      <Header back="/email" />
      <div className="space-y-4 px-5 pt-2">
        <h1 className="text-[28px] leading-[34px]">Check your email</h1>
        <p className="text-muted">We sent a verification code to {mask(email)}.</p>
        <VerifyForm email={email} />
      </div>
    </main>
  );
}
