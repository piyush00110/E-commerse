import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { ApiError } from '../utils/apiError';
import { AuthRequest } from '../types';
import { mapOrder, mapOrders } from '../utils/mapFields';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const { data: cart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (!cart || !(cart as any).cart_items?.length) throw new ApiError(400, 'Cart is empty');
    const items = (cart as any).cart_items;

    for (const item of items) {
      const { data: product } = await supabase.from('products').select('count_in_stock').eq('id', item.product_id).single();
      if (!product || product.count_in_stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${item.name}`);
      }
    }

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const taxPrice = Math.round(subtotal * 0.08 * 100) / 100;
    const shippingPrice = subtotal > 50 ? 0 : 9.99;
    const totalPrice = subtotal + taxPrice + shippingPrice;

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: req.user!.id,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        tax_price: taxPrice,
        shipping_price: shippingPrice,
        total_price: totalPrice,
      })
      .select()
      .single();

    if (orderErr || !order) throw new ApiError(500, 'Failed to create order');

    for (const item of items) {
      const { error: itemErr } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      });
      if (itemErr) throw itemErr;

      const { data: stockProduct } = await supabase
        .from('products')
        .select('count_in_stock')
        .eq('id', item.product_id)
        .single();
      if (stockProduct) {
        const newStock = Math.max(0, stockProduct.count_in_stock - item.quantity);
        await supabase.from('products').update({ count_in_stock: newStock }).eq('id', item.product_id);
      }
    }

    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', cart.id);

    const { data: fullOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();

    res.status(201).json({ success: true, data: mapOrder(fullOrder || order) });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: mapOrders(orders || []) });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users!inner(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !order) throw new ApiError(404, 'Order not found');

    const userId = (order as any).user_id;
    if (userId !== req.user!.id && req.user!.role !== 'admin') {
      throw new ApiError(403, 'Not authorized');
    }

    res.json({ success: true, data: mapOrder(order) });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users!inner(name, email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: mapOrders(orders || []) });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, isDelivered } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (isDelivered) {
      updates.is_delivered = true;
      updates.delivered_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single();

    if (error || !order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, data: mapOrder(order) });
  } catch (error) {
    next(error);
  }
};

export const payOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_result: req.body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single();

    if (error || !order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, data: mapOrder(order) });
  } catch (error) {
    next(error);
  }
};


