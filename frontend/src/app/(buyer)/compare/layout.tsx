import type { Metadata } from 'next';
import React from 'react';
import { SITE_NAME } from '../../../lib/seo';

export const metadata: Metadata = {
  title: 'Compare Products',
  description: 'Compare prices, ratings, availability and features side by side.',
  alternates: { canonical: '/compare' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `Compare Products | ${SITE_NAME}`,
    description: 'Compare prices, ratings, availability and features side by side.',
    url: '/compare',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
