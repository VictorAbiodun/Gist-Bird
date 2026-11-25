import { getProfile } from '@/lib/data';
import { EditProfileView } from '@/components/EditProfileView';

export default async function EditProfile() {
  const p = await getProfile();
  if (!p) return null;
  return <EditProfileView profile={p} />;
}
