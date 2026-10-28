import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';

import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

import './globals.css';

// Self-hosted at build time by next/font, so no requests go to Google at runtime.
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata = {
  title: 'Plant Scanner',
  description: 'Snap or upload a photo of a plant to identify it and learn about it.',
  applicationName: 'Plant Scanner',
  appleWebApp: {
    capable: true,
    title: 'Plant Scanner',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f5f7f1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <div className="app">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
