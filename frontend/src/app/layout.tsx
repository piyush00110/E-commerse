import type { Metadata, Viewport } from 'next';
import RootClientLayout from './RootClientLayout';
import './globals.css';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopsmart.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShopSmart - Modern E-Commerce',
    template: '%s | ShopSmart',
  },
  description: 'Your one-stop shop for electronics, fashion, home goods and more.',
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    siteName: 'ShopSmart',
    title: 'ShopSmart - Modern E-Commerce',
    description: 'Your one-stop shop for electronics, fashion, home goods and more.',
  },
  twitter: {
    card: 'summary',
    title: 'ShopSmart - Modern E-Commerce',
    description: 'Your one-stop shop for electronics, fashion, home goods and more.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}
