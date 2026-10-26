import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

import './globals.css';

export const metadata = {
  title: 'Plant Scanner',
  description: 'Snap or upload a photo of a plant to identify it and get care tips.',
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
  themeColor: '#2e7d4f',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app">{children}</div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
