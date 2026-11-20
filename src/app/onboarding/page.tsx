import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/data';
import { ProfileWizard } from '@/components/ProfileWizard';

export const dynamic = 'force-dynamic';

export default async function Onboarding() {
  if (await getProfile()) redirect('/home');
  return <ProfileWizard />;
}
