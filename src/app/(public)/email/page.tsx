import { Header } from '@/components/ui';
import { EmailForm } from '@/components/AuthForms';

export default function EmailPage() {
  return (
    <main>
      <Header back="/welcome" />
      <div className="space-y-4 px-5 pt-2">
        <h1 className="text-[28px] leading-[34px]">Use your school email</h1>
        <p className="text-muted">We check that you are a student. Your email is never shown to anyone.</p>
        <EmailForm />
      </div>
    </main>
  );
}
