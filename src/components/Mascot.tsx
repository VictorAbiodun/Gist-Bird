import Image from 'next/image';
import { MASCOT, type Pose } from '@/lib/assets';

export function Mascot({ pose = 'wave', size = 160, className = '', priority = false }: { pose?: Pose; size?: number; className?: string; priority?: boolean }) {
  return <Image src={MASCOT[pose]} alt="" width={size} height={Math.round(size * 0.9)} unoptimized priority={priority} className={className} />;
}
