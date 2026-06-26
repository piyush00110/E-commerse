import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapProducts } from '@/lib/apiUtils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const sort = searchParams.get('sort') || '-created_at';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('products').select('*, categories(name, slug)', { count: 'exact' });

    const q = searchParams.get('search');
    if (q) {
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);
    }
    const category = searchParams.get('category');
    if (category) {
      query = query.eq('category_id', category);
    }
    const minPrice = searchParams.get('minPrice');
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    const maxPrice = searchParams.get('maxPrice');
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    const rating = searchParams.get('rating');
    if (rating) {
      query = query.gte('rating', parseFloat(rating));
    }

    const sortDir = sort.startsWith('-') ? 'desc' as const : 'asc' as const;
    const sortField = sort.replace(/^-/, '');
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data: products, error, count } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapProducts(products || []),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
