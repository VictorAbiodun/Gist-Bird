'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { commitNavPath, getNavDirection } from '@/lib/navDirection';

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [dir] = useState<-1 | 0 | 1>(() => getNavDirection(pathname));

  useEffect(() => {
    commitNavPath(pathname);
  }, [pathname]);

  const initialX = dir === 1 ? '42%' : dir === -1 ? '-36%' : 0;

  return (
    <motion.div
      initial={dir === 0 ? { opacity: 0 } : { x: initialX, opacity: 0.4 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 32,
        mass: 0.8,
      }}
      style={{ willChange: 'transform, opacity' }}
      className="flex flex-1 flex-col overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}
