import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapProduct } from '@/lib/apiUtils';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', params.id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const snakeToCamel = (str: string): string =>
      str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

    const mappedReviews = (reviews || []).map((r: Record<string, unknown>) => {
      const m: Record<string, unknown> = {};
      for (const key of Object.keys(r)) {
        if (key === 'id') m._id = r[key];
        else if (key === 'user_id') m.user = r[key];
        else if (key === 'product_id') m.product = r[key];
        else if (key === 'created_at') m.createdAt = r[key];
        else m[snakeToCamel(key)] = r[key];
      }
      return m;
    });

    return NextResponse.json({
      success: true,
      data: { ...mapProduct(product), reviews: mappedReviews },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch product';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
