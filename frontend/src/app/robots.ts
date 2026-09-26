import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopsmart.example.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/products', '/help'],
        disallow: [
          '/account',
          '/cart',
          '/checkout',
          '/buy',
          '/orders',
          '/order-confirmation',
          '/wishlist',
          '/manage',
          '/shipping',
          '/shipping-dashboard',
          '/delivery',
          '/seller',
          '/sell',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
