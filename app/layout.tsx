import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'K-KUT — Exact Song Section Ownership',
  description:
    'K-KUT is a G Putnam Music invention. Own an exact excerpt of a song section — legally, permanently, and playably.',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'K-KUT' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-[#F5e6c8] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
