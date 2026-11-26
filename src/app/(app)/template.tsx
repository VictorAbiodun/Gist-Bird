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

  const initialX = dir === 1 ? '28%' : dir === -1 ? '-24%' : 0;

  return (
    <motion.div
      initial={dir === 0 ? { opacity: 0 } : { x: initialX, opacity: 0.25 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-1 flex-col overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}
