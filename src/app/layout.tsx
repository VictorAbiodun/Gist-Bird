import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/dm-sans';
import './globals.css';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gist-bird.vercel.app'),
  title: 'Gist Bird',
  description: 'Send a paper across campus. Chief Coo carries it.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#0A7D3E', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <OfflineBanner />
        <div className="mx-auto min-h-dvh w-full max-w-[480px]">{children}</div>
      </body>
    </html>
  );
}
