import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../types';
import { mapCart } from '../utils/mapFields';

export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let { data: cart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ user_id: req.user!.id })
        .select('*, cart_items(*)')
        .single();

      if (error) throw error;
      cart = newCart;
    }

    const totalItems = (cart as any).cart_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
    const totalPrice = (cart as any).cart_items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

    res.json({ success: true, data: mapCart({ ...cart, totalItems, totalPrice }) });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, quantity = 1 } = req.body;

    const { data: product } = await supabase.from('products').select('*').eq('id', productId).single();
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.count_in_stock < quantity) throw new ApiError(400, 'Insufficient stock');

    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ user_id: req.user!.id })
        .select('id')
        .single();
      if (error) throw error;
      cart = newCart;
    }

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          name: product.name,
          image: product.images?.[0] || '',
          price: product.price,
          quantity,
        });
      if (error) throw error;
    }

    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

    const { data: updatedCart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('id', cart.id)
      .single();

    const totalItems = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
    const totalPrice = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

    res.json({ success: true, data: mapCart({ ...updatedCart, totalItems, totalPrice }) });
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (!cart) throw new ApiError(404, 'Cart not found');

    const { data: item } = await supabase
      .from('cart_items')
      .select('*, products(count_in_stock)')
      .eq('id', itemId)
      .eq('cart_id', cart.id)
      .single();
    if (!item) throw new ApiError(404, 'Item not found in cart');

    if ((item as any).products?.count_in_stock < quantity) throw new ApiError(400, 'Insufficient stock');

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);
    if (error) throw error;

    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

    const { data: updatedCart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('id', cart.id)
      .single();

    const totalItems = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
    const totalPrice = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

    res.json({ success: true, data: mapCart({ ...updatedCart, totalItems, totalPrice }) });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { itemId } = req.params;

    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();
    if (!cart) throw new ApiError(404, 'Cart not found');

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cart.id);
    if (error) throw error;

    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

    const { data: updatedCart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('id', cart.id)
      .single();

    const totalItems = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;
    const totalPrice = updatedCart?.cart_items?.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0) || 0;

    res.json({ success: true, data: mapCart({ ...updatedCart, totalItems, totalPrice }) });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (cart) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);
    }

    res.json({ success: true, data: cart ? mapCart({ ...cart, cart_items: [], totalItems: 0, totalPrice: 0 }) : null });
  } catch (error) {
    next(error);
  }
};
