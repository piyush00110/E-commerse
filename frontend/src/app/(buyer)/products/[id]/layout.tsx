import type { Metadata } from 'next';
import React from 'react';
import {
  getProductForSeo,
  productJsonLd,
  breadcrumbJsonLd,
  truncate,
  SITE_NAME,
} from '../../../../lib/seo';
import type { Category } from '../../../../types';

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const product = await getProductForSeo(params.id);
  if (!product) {
    return {
      title: 'Product not found',
      robots: { index: false, follow: true },
    };
  }

  const description = truncate(product.description);
  const images = (product.images || []).filter(Boolean).slice(0, 4);
  const canonical = `/products/${product._id}`;

  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${product.name} | ${SITE_NAME}`,
      description,
      url: canonical,
      images: images.map((url) => ({ url })),
    },
    twitter: {
      card: images.length ? 'summary_large_image' : 'summary',
      title: `${product.name} | ${SITE_NAME}`,
      description,
      images,
    },
  };
}

export default async function ProductLayout({ children, params }: LayoutProps) {
  const product = await getProductForSeo(params.id);

  let structuredData: Record<string, unknown>[] = [];
  if (product) {
    const category = product.category as Category | string | undefined;
    const crumbs: { name: string; path: string }[] = [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ];
    if (category && typeof category === 'object' && category.name && category.slug) {
      crumbs.push({ name: category.name, path: `/products?category=${category.slug}` });
    }
    crumbs.push({ name: product.name, path: `/products/${product._id}` });
    structuredData = [productJsonLd(product), breadcrumbJsonLd(crumbs)];
  }

  return (
    <>
      {structuredData.map((data, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          // JSON.stringify is safe here: it escapes quotes; only trusted DB fields.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      {children}
    </>
  );
}
