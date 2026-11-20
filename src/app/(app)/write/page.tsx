import { getPaper, getProfile, papersLeft } from '@/lib/data';
import { WriteForm } from '@/components/WriteForm';
import { Header } from '@/components/ui';
import { isPickable, getSpot } from '@/lib/campus';

export default async function Write({ searchParams }: { searchParams: { from?: string } }) {
  const [profile, left, prev] = await Promise.all([getProfile(), papersLeft(), searchParams.from ? getPaper(searchParams.from) : null]);
  const fav = profile?.favourite_spot;
  const origin = prev?.origin ?? (fav && getSpot(fav) && isPickable(getSpot(fav)!) ? fav : 'gate');
  return (
    <main>
      <Header title="Write a paper" back="/home" />
      <WriteForm initialBody={prev?.role === 'author' ? prev.body ?? '' : ''} defaultOrigin={origin} left={left} />
    </main>
  );
}
