import type { MetadataRoute } from 'next';
import { getProductsForSitemap, getCategoriesForSeo, SITE_URL } from '../lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/help`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/tracking`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [products, categories] = await Promise.all([
    getProductsForSitemap(),
    getCategoriesForSeo(),
  ]);

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/products/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/products?category=${encodeURIComponent(c.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
