import { getProfile } from '@/lib/data';
import { ProfileWizard } from '@/components/ProfileWizard';

export default async function EditProfile() {
  const p = await getProfile();
  if (!p) return null;
  return <ProfileWizard mode="edit" initial={{ displayName: p.display_name, nameMode: p.name_mode, scarf: p.scarf, interests: p.interests, spot: p.favourite_spot, starter: p.starter_prompt ?? '' }} />;
}
