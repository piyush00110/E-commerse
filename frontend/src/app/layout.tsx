import type { Metadata } from 'next';
import RootClientLayout from './RootClientLayout';
import './globals.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ShopSmart - Modern E-Commerce',
  description: 'Your one-stop shop for electronics, fashion, home goods and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RootClientLayout>{children}</RootClientLayout>
      </body>
    </html>
  );
}
