import type { Metadata } from 'next';
import React from 'react';
import { SITE_NAME } from '../../../lib/seo';

export const metadata: Metadata = {
  title: 'Shop All Products',
  description:
    'Browse electronics, fashion, home goods and more. Filter by category, price and rating to find exactly what you need.',
  alternates: { canonical: '/products' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `Shop All Products | ${SITE_NAME}`,
    description:
      'Browse electronics, fashion, home goods and more. Filter by category, price and rating to find exactly what you need.',
    url: '/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
