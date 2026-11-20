import { Header } from '@/components/ui';
import { SetPasswordForm } from '@/components/AuthForms';

export default function PasswordSettingsPage() {
  return (
    <main>
      <Header title="Password" back="/settings" />
      <div className="space-y-4 px-5 pt-2">
        <h1 className="text-[24px] leading-[30px]">Set or change password</h1>
        <p className="text-muted">Setting a password lets you log in quickly without waiting for an email OTP.</p>
        <SetPasswordForm />
      </div>
    </main>
  );
}
