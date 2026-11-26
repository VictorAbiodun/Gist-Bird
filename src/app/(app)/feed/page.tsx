import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/data';
import { getFeedPosts } from '@/lib/feedData';
import { FeedClient } from '@/components/FeedClient';
import { PullToRefresh } from '@/components/PullToRefresh';

export default async function FeedPage() {
  const profile = await getProfile();
  if (!profile) redirect('/onboarding');

  const posts = await getFeedPosts({
    scope: 'all',
    userId: profile.id,
    userUniversity: profile.university,
    limit: 60,
  });

  return (
    <PullToRefresh>
      <FeedClient initialPosts={posts} profile={profile} />
    </PullToRefresh>
  );
}
