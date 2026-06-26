import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapProducts } from '@/lib/apiUtils';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(8);

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapProducts(products || []) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch featured products';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
