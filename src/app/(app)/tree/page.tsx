import { Header } from '@/components/ui';
import { TreeScene } from '@/components/tree/TreeScene';
import { getInbox, getProfile } from '@/lib/data';

export const metadata = {
  title: 'The Message Tree · Gist Bird',
  description: 'A living environment where gists and letters find their rest.',
};

export default async function MessageTreePage() {
  const [profile, inbox] = await Promise.all([getProfile(), getInbox()]);

  return (
    <main className="min-h-dvh flex flex-col">
      <Header title="The Message Tree" back="/home" />
      <div className="flex-1 px-4 pb-6 pt-1">
        <TreeScene
          messageMode="full"
          userId={profile?.id}
          inboxPapers={inbox}
          userDisplayName={profile?.display_name ?? 'You'}
          userAvatar={profile?.avatar ?? '/avatars/avatar-01.svg'}
        />
      </div>
    </main>
  );
}
