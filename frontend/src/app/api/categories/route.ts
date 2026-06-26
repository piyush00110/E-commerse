import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapCategories } from '@/lib/apiUtils';

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, data: mapCategories(categories || []) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch categories';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
