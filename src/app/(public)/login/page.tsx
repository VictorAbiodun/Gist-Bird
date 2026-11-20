import { Header } from '@/components/ui';
import { LoginForm } from '@/components/AuthForms';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main>
      <Header back="/welcome" />
      <div className="space-y-4 px-5 pt-2">
        <h1 className="text-[28px] leading-[34px]">Welcome back</h1>
        <p className="text-muted">Sign in with your school email and password.</p>
        <LoginForm />
        <div className="pt-4 text-center text-label text-muted">
          Don&apos;t have an account yet?{' '}
          <Link href="/email" className="font-semibold text-primary underline">
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
