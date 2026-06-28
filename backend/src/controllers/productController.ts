import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest, PaginationQuery } from '../types';
import { mapProduct, mapProducts, mapReview } from '../utils/mapFields';

export const getProducts = async (req: AuthRequest & { query: PaginationQuery }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const reqLimit = parseInt(req.query.limit || '0', 10);
    const limit = reqLimit > 0 ? reqLimit : 200;
    const sort = req.query.sort || '-created_at';
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('products').select('*, categories(name, slug)', { count: 'exact' });

    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,description.ilike.%${req.query.search}%,brand.ilike.%${req.query.search}%`);
    }
    if (req.query.category) {
      query = query.eq('category_id', req.query.category);
    }
    if (req.query.minPrice) {
      query = query.gte('price', parseFloat(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      query = query.lte('price', parseFloat(req.query.maxPrice));
    }
    if (req.query.rating) {
      query = query.gte('rating', parseFloat(req.query.rating));
    }

    const sortDir = sort.startsWith('-') ? 'desc' as const : 'asc' as const;
    const sortField = sort.replace(/^-/, '');
    query = query.order(sortField, { ascending: sortDir === 'asc' });

    const { data: products, error, count } = await query.range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      data: mapProducts(products || []),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / Math.max(limit, 1)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('id', req.params.id)
      .single();

    if (error || !product) throw new ApiError(404, 'Product not found');

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({ success: true, data: mapProduct({ ...product, reviews: (reviews || []).map(mapReview) }) });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const insertData = { ...req.body };
    if (insertData.category) {
      insertData.category_id = insertData.category;
      delete insertData.category;
    }
    const { data: product, error } = await supabase
      .from('products')
      .insert(insertData)
      .select('*, categories(name, slug)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data: product, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, categories(name, slug)')
      .single();

    if (error || !product) throw new ApiError(404, 'Product not found');
    res.json({ success: true, data: mapProduct(product) });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error, count } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('id', req.params.id);

    if (error) throw error;
    if (count === 0) throw new ApiError(404, 'Product not found');
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { rating, title, comment } = req.body;
    const productId = req.params.id;

    const { data: product } = await supabase.from('products').select('id').eq('id', productId).single();
    if (!product) throw new ApiError(404, 'Product not found');

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) throw new ApiError(400, 'Product already reviewed');

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({ user_id: req.user!.id, product_id: productId, name: 'Anonymous', rating: Number(rating), title, comment })
      .select()
      .single();

    if (error || !review) throw new ApiError(500, 'Failed to create review');

    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId);

    const numReviews = reviews?.length || 0;
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 0;

    await supabase
      .from('products')
      .update({ num_reviews: numReviews, rating: Math.round(avgRating * 100) / 100, updated_at: new Date().toISOString() })
      .eq('id', productId);

    res.status(201).json({ success: true, data: mapReview(review) });
  } catch (error) {
    next(error);
  }
};

export const getFeaturedProducts = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name, slug)')
      .eq('is_featured', true)
      .order('rating', { ascending: false })
      .limit(8);

    if (error) throw error;
    res.json({ success: true, data: mapProducts(products || []) });
  } catch (error) {
    next(error);
  }
};
