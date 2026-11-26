import { notFound, redirect } from 'next/navigation';
import { getProfile } from '@/lib/data';
import { getFeedPostThread } from '@/lib/feedData';
import { FeedThreadClient } from '@/components/FeedThreadClient';

export default async function FeedThreadPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  if (!profile) redirect('/onboarding');

  const { root, replies } = await getFeedPostThread(params.id, profile.id);
  if (!root) notFound();

  return <FeedThreadClient initialRoot={root} initialReplies={replies} profile={profile} />;
}
