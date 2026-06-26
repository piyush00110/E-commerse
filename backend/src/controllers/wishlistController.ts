import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../types';
import { mapWishlist } from '../utils/mapFields';

export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { data: wishlist } = await supabase
      .from('wishlists')
      .select('*, wishlist_products(product_id, products(*))')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!wishlist) {
      const { data: newWl, error } = await supabase
        .from('wishlists')
        .insert({ user_id: req.user!.id })
        .select('*, wishlist_products(product_id, products(*))')
        .single();

      if (error) throw error;
      wishlist = newWl;
    }

    res.json({ success: true, data: mapWishlist(wishlist) });
  } catch (error) {
    next(error);
  }
};

export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.body;

    let { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!wishlist) {
      const { data: newWl, error } = await supabase
        .from('wishlists')
        .insert({ user_id: req.user!.id })
        .select('id')
        .single();
      if (error) throw error;
      wishlist = newWl;
    }

    const { data: existing } = await supabase
      .from('wishlist_products')
      .select('id')
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('wishlist_products')
        .insert({ wishlist_id: wishlist.id, product_id: productId });
      if (error) throw error;
    }

    const { data: populated } = await supabase
      .from('wishlists')
      .select('*, wishlist_products(product_id, products(*))')
      .eq('id', wishlist.id)
      .single();

    res.json({ success: true, data: mapWishlist(populated) });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!wishlist) throw new ApiError(404, 'Wishlist not found');

    const { error } = await supabase
      .from('wishlist_products')
      .delete()
      .eq('wishlist_id', wishlist.id)
      .eq('product_id', productId);

    if (error) throw error;

    const { data: populated } = await supabase
      .from('wishlists')
      .select('*, wishlist_products(product_id, products(*))')
      .eq('id', wishlist.id)
      .single();

    res.json({ success: true, data: mapWishlist(populated) });
  } catch (error) {
    next(error);
  }
};
