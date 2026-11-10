import { supabase } from './supabase';
import { mapProduct } from './apiUtils';
import type { Category, Product } from '../types';

const db = supabase as any;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopsmart.example.com';
export const SITE_NAME = 'ShopSmart';
export const SITE_DESCRIPTION =
  'Your one-stop shop for electronics, fashion, home goods and more.';

function supabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
  );
}

/** Trim text to a search-snippet friendly length without cutting words mid-way. */
export function truncate(text: string | undefined | null, max = 160): string {
  if (!text) return SITE_DESCRIPTION;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Load a single product for metadata/structured data. Never throws. */
export async function getProductForSeo(id: string): Promise<Product | null> {
  if (!supabaseConfigured() || !id) return null;
  try {
    const { data, error } = await db
      .from('products')
      .select('id, name, description, price, compare_price, images, brand, count_in_stock, rating, num_reviews, created_at, updated_at, category_id, categories(name, slug)')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapProduct(data) as unknown as Product;
  } catch {
    return null;
  }
}

/** Load categories for the sitemap and catalog navigation. Never throws. */
export async function getCategoriesForSeo(): Promise<Category[]> {
  if (!supabaseConfigured()) return [];
  try {
    const { data, error } = await db.from('categories').select('id, name, slug, image');
    if (error || !data) return [];
    return (data as Record<string, unknown>[]).map((c) => ({
      _id: c.id as string,
      name: c.name as string,
      slug: c.slug as string,
      image: (c.image as string) || undefined,
    }));
  } catch {
    return [];
  }
}

/** Product ids + last modified timestamps for the sitemap. Never throws. */
export async function getProductsForSitemap(): Promise<
  { id: string; updatedAt: string }[]
> {
  if (!supabaseConfigured()) return [];
  try {
    // Supabase caps a single response at 1000 rows, so page through the catalog.
    const rows: Record<string, unknown>[] = [];
    const pageSize = 1000;
    for (let from = 0; from < 5000; from += pageSize) {
      const { data, error } = await db
        .from('products')
        .select('id, updated_at')
        .order('updated_at', { ascending: false })
        .range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      rows.push(...(data as Record<string, unknown>[]));
      if (data.length < pageSize) break;
    }
    return rows.map((p) => ({
      id: p.id as string,
      updatedAt: (p.updated_at as string) || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

/** Product JSON-LD (schema.org Product) for rich search results. */
export function productJsonLd(product: Product) {
  const images = (product.images || []).filter(Boolean);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: truncate(product.description, 300),
    sku: product._id,
    image: images,
    url: absoluteUrl(`/products/${product._id}`),
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product._id}`),
      priceCurrency: 'USD',
      price: Number(product.price || 0).toFixed(2),
      availability:
        Number(product.countInStock || 0) > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
  if (Number(product.rating) > 0 && Number(product.numReviews) > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating).toFixed(1),
      reviewCount: Number(product.numReviews),
    };
  }
  return data;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
