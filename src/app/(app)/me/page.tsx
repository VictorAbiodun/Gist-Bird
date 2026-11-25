import { getChats, getNotifications, getProfile, getRewardStatus, getSent } from '@/lib/data';
import { getSpot } from '@/lib/campus';
import { getBirdStats } from '@/lib/bird';
import { ProfileView } from '@/components/ProfileView';

export default async function Me() {
  const [profile, rewardStatus, sent, chats, notes] = await Promise.all([
    getProfile(),
    getRewardStatus(),
    getSent(),
    getChats(),
    getNotifications(),
  ]);

  if (!profile) return null;

  const birdStats = getBirdStats(profile.created_at, sent.length, profile.bird_name);
  const spotName = getSpot(profile.favourite_spot)?.name ?? 'Campus';
  const unreadNotifications = notes.filter((n) => !n.read_at).length;

  return (
    <ProfileView
      profile={profile}
      rewardStatus={rewardStatus}
      birdStats={birdStats}
      spotName={spotName}
      papersSentCount={sent.length}
      chatsCount={chats.length}
      unreadNotifications={unreadNotifications}
    />
  );
}
