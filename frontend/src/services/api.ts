import { supabase } from '../lib/supabase';
import { mapProduct, mapProducts, mapCategory, mapCategories } from '../lib/apiUtils';
import type { Category } from '../types';

const db = supabase as any;

function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user: Record<string, unknown> | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
}

function currentUserId(): string | null {
  return getStoredUser()?._id || null;
}

// ==================== AUTH ====================

export const authAPI = {
  register: async (data: { name: string; email: string; password: string }) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });
    if (signUpError || !authData?.user) throw { response: { data: { message: signUpError?.message || 'Registration failed' } } };
    const userId = authData.user.id;
    const { error: insertError } = await db.from('users').insert({ id: userId, name: data.name, email: data.email, role: 'user' });
    if (insertError) await supabase.auth.admin.deleteUser(userId);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (signInError || !signInData?.session) throw { response: { data: { message: 'Login after registration failed' } } };
    const userData = { _id: userId, name: data.name, email: data.email, role: 'user', token: signInData.session.access_token };
    setStoredUser(userData);
    return { data: { success: true, data: userData } };
  },

  login: async (data: { email: string; password: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (authError || !authData?.session) throw { response: { data: { message: authError?.message || 'Invalid credentials' } } };
    const userId = authData.user.id;
    const { data: userRow } = await db.from('users').select('*').eq('id', userId).single();
    if (!userRow) await db.from('users').insert({ id: userId, name: authData.user.user_metadata?.name || 'User', email: data.email, role: 'user' });
    const user = userRow || { id: userId, name: authData.user.user_metadata?.name || 'User', email: data.email, role: 'user' };
    const userData = { _id: user.id, name: user.name, email: user.email, role: user.role, token: authData.session.access_token };
    setStoredUser(userData);
    return { data: { success: true, data: userData } };
  },

  getProfile: async () => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Not authenticated' } } };
    const { data: user, error } = await db.from('users').select('*').eq('id', uid).single();
    if (error) throw { response: { data: { message: 'Failed to load profile' } } };
    return { data: { success: true, data: user ? { _id: user.id, ...user } : null } };
  },

  updateProfile: async (data: Partial<{ name: string; email: string; password: string; address: unknown }>) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Not authenticated' } } };
    const updates: Record<string, unknown> = {};
    if (data.name) updates.name = data.name;
    if (data.address) updates.address = data.address;
    if (Object.keys(updates).length > 0) await db.from('users').update(updates).eq('id', uid);
    if (data.password) await supabase.auth.updateUser({ password: data.password });
    if (data.email) await supabase.auth.updateUser({ email: data.email });
    const { data: user } = await db.from('users').select('*').eq('id', uid).single();
    return { data: { success: true, data: user ? { _id: user.id, ...user } : null } };
  },
};

// ==================== PRODUCTS ====================

export const productAPI = {
  getAll: async (params?: Record<string, string | number>) => {
    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 200;
    const sort = (params?.sort as string) || '-created_at';
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let query = db.from('products').select('*, categories(name, slug)', { count: 'exact' });
    if (params?.search) {
      const s = String(params.search);
      query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%,brand.ilike.%${s}%`);
    }
    if (params?.category) {
      const cat = String(params.category);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat);
      if (isUuid) query = query.eq('category_id', cat);
      else {
        const { data: catRow } = await db.from('categories').select('id').eq('slug', cat).single();
        if (catRow) query = query.eq('category_id', catRow.id);
      }
    }
    if (params?.minPrice) query = query.gte('price', Number(params.minPrice));
    if (params?.maxPrice) query = query.lte('price', Number(params.maxPrice));
    if (params?.rating) query = query.gte('rating', Number(params.rating));
    const sortDir = sort.startsWith('-') ? 'desc' as const : 'asc' as const;
    const sortField = sort.replace(/^-/, '');
    query = query.order(sortField, { ascending: sortDir === 'asc' });
    const { data: products, error, count } = await query.range(from, to);
    if (error) throw { response: { data: { message: error.message } } };
    return {
      data: {
        success: true,
        data: mapProducts(products || []) as any,
        pagination: { page, limit, total: count || 0, pages: Math.ceil((count || 0) / Math.max(limit, 1)) },
      },
    };
  },

  getFeatured: async () => {
    const { data: products, error } = await db.from('products').select('*, categories(name, slug)').eq('is_featured', true).order('rating', { ascending: false }).limit(8);
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: mapProducts(products || []) as any } };
  },

  getById: async (id: string) => {
    const { data: product, error } = await db.from('products').select('*, categories(name, slug)').eq('id', id).single();
    if (error || !product) throw { response: { data: { message: 'Product not found' } } };
    const { data: reviews } = await db.from('reviews').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(10);
    const mapped = mapProduct(product) as any;
    mapped.reviews = (reviews || []).map((r: any) => ({ _id: r.id, user: r.user_id, product: r.product_id, name: r.name, rating: r.rating, title: r.title, comment: r.comment, createdAt: r.created_at }));
    return { data: { success: true, data: mapped } };
  },

  create: async (data: unknown) => {
    const d = data as Record<string, unknown>;
    const insertData: Record<string, unknown> = { ...d };
    if (insertData.category) { insertData.category_id = insertData.category; delete insertData.category; }
    const { data: product, error } = await db.from('products').insert(insertData).select('*, categories(name, slug)').single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: mapProduct(product) as any } };
  },

  update: async (id: string, data: unknown) => {
    const updates = { ...(data as Record<string, unknown>), updated_at: new Date().toISOString() };
    const { data: product, error } = await db.from('products').update(updates).eq('id', id).select('*, categories(name, slug)').single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: mapProduct(product) as any } };
  },

  delete: async (id: string) => {
    const { error } = await db.from('products').delete().eq('id', id);
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, message: 'Product deleted' } };
  },

  createReview: async (id: string, data: { rating: number; title: string; comment: string }) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Not authenticated' } } };
    const { data: existing } = await db.from('reviews').select('id').eq('user_id', uid).eq('product_id', id).maybeSingle();
    if (existing) throw { response: { data: { message: 'Product already reviewed' } } };
    const stored = getStoredUser();
    const { data: review, error } = await db.from('reviews').insert({
      user_id: uid, product_id: id, name: stored?.name || 'Anonymous',
      rating: Number(data.rating), title: data.title, comment: data.comment,
    }).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    const { data: allRatings } = await db.from('reviews').select('rating').eq('product_id', id);
    const numReviews = allRatings?.length || 0;
    const avgRating = allRatings && allRatings.length > 0 ? allRatings.reduce((acc: number, r: any) => acc + r.rating, 0) / allRatings.length : 0;
    await db.from('products').update({ num_reviews: numReviews, rating: Math.round(avgRating * 100) / 100, updated_at: new Date().toISOString() }).eq('id', id);
    return { data: { success: true, data: { _id: review.id, user: review.user_id, product: review.product_id, name: review.name, rating: review.rating, title: review.title, comment: review.comment, createdAt: review.created_at } } };
  },
};

// ==================== CART ====================

export const cartAPI = {
  get: async () => {
    const uid = currentUserId();
    if (!uid) return { data: { success: true, data: { _id: '', user: '', items: [], totalItems: 0, totalPrice: 0 } } };
    const { data: cart } = await db.from('carts').select('*').eq('user_id', uid).maybeSingle();
    if (!cart) return { data: { success: true, data: { _id: '', user: uid, items: [], totalItems: 0, totalPrice: 0 } } };
    const { data: items } = await db.from('cart_items').select('*').eq('cart_id', cart.id);
    const totalItems = (items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    const totalPrice = (items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    return {
      data: {
        success: true,
        data: {
          _id: cart.id, user: cart.user_id,
          items: (items || []).map((i: any) => ({ _id: i.id, product: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity })),
          totalItems, totalPrice: Math.round(totalPrice * 100) / 100,
        },
      },
    };
  },

  add: async (productId: string, quantity = 1) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Login required' } } };
    const { data: product } = await db.from('products').select('name, price, images').eq('id', productId).single();
    if (!product) throw { response: { data: { message: 'Product not found' } } };
    let { data: cart } = await db.from('carts').select('*').eq('user_id', uid).maybeSingle();
    if (!cart) {
      const { data: newCart } = await db.from('carts').insert({ user_id: uid }).select().single();
      cart = newCart;
    }
    if (!cart) throw { response: { data: { message: 'Failed to create cart' } } };
    const { data: existingItem } = await db.from('cart_items').select('*').eq('cart_id', cart.id).eq('product_id', productId).maybeSingle();
    if (existingItem) {
      await db.from('cart_items').update({ quantity: existingItem.quantity + quantity }).eq('id', existingItem.id);
    } else {
      await db.from('cart_items').insert({
        cart_id: cart.id, product_id: productId,
        name: product.name, image: (product.images || [])[0] || '', price: Number(product.price), quantity,
      });
    }
    const { data: items } = await db.from('cart_items').select('*').eq('cart_id', cart.id);
    const totalItems = (items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    const totalPrice = (items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    return {
      data: {
        success: true,
        data: {
          _id: cart.id, user: cart.user_id,
          items: (items || []).map((i: any) => ({ _id: i.id, product: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity })),
          totalItems, totalPrice: Math.round(totalPrice * 100) / 100,
        },
      },
    };
  },

  update: async (itemId: string, quantity: number) => {
    await db.from('cart_items').update({ quantity }).eq('id', itemId);
    const { data: item } = await db.from('cart_items').select('cart_id').eq('id', itemId).single();
    if (!item) throw { response: { data: { message: 'Item not found' } } };
    const { data: cart } = await db.from('carts').select('*').eq('id', item.cart_id).single();
    const { data: items } = await db.from('cart_items').select('*').eq('cart_id', item.cart_id);
    const totalItems = (items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    const totalPrice = (items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    return { data: { success: true, data: { _id: cart.id, user: cart.user_id, items: (items || []).map((i: any) => ({ _id: i.id, product: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity })), totalItems, totalPrice: Math.round(totalPrice * 100) / 100 } } };
  },

  remove: async (itemId: string) => {
    const { data: item } = await db.from('cart_items').select('cart_id').eq('id', itemId).single();
    if (!item) throw { response: { data: { message: 'Item not found' } } };
    await db.from('cart_items').delete().eq('id', itemId);
    const { data: cart } = await db.from('carts').select('*').eq('id', item.cart_id).single();
    const { data: items } = await db.from('cart_items').select('*').eq('cart_id', item.cart_id);
    const totalItems = (items || []).reduce((s: number, i: any) => s + i.quantity, 0);
    const totalPrice = (items || []).reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    return { data: { success: true, data: { _id: cart.id, user: cart.user_id, items: (items || []).map((i: any) => ({ _id: i.id, product: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity })), totalItems, totalPrice: Math.round(totalPrice * 100) / 100 } } };
  },

  clear: async () => {
    const uid = currentUserId();
    if (!uid) return { data: { success: true, data: { _id: '', user: '', items: [], totalItems: 0, totalPrice: 0 } } };
    const { data: cart } = await db.from('carts').select('id').eq('user_id', uid).maybeSingle();
    if (cart) await db.from('cart_items').delete().eq('cart_id', cart.id);
    return { data: { success: true, data: { _id: '', user: '', items: [], totalItems: 0, totalPrice: 0 } } };
  },
};

// ==================== ORDERS ====================

function mapOrder(order: any) {
  return {
    _id: order.id,
    user: order.users || order.user_id,
    items: (order.order_items || []).map((i: any) => ({ _id: i.id, product: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity })),
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
    taxPrice: Number(order.tax_price),
    shippingPrice: Number(order.shipping_price),
    totalPrice: Number(order.total_price),
    isPaid: order.is_paid,
    paidAt: order.paid_at,
    isDelivered: order.is_delivered,
    deliveredAt: order.delivered_at,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at || order.created_at,
  };
}

export const orderAPI = {
  create: async (data: { shippingAddress: unknown; paymentMethod: string }) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Not authenticated' } } };
    const { data: cart } = await db.from('carts').select('*, cart_items(*)').eq('user_id', uid).single();
    if (!cart || !cart.cart_items?.length) throw { response: { data: { message: 'Cart is empty' } } };
    const items = cart.cart_items as any[];
    for (const item of items) {
      const { data: prod } = await db.from('products').select('count_in_stock').eq('id', item.product_id).single();
      if (!prod || prod.count_in_stock < item.quantity) throw { response: { data: { message: `Insufficient stock for ${item.name}` } } };
    }
    const subtotal = items.reduce((s: number, i: any) => s + Number(i.price) * i.quantity, 0);
    const shippingPrice = subtotal >= 50 ? 0 : 9.99;
    const taxPrice = subtotal * 0.08;
    const totalPrice = subtotal + shippingPrice + taxPrice;
    const { data: order, error: orderError } = await db.from('orders').insert({
      user_id: uid, shipping_address: data.shippingAddress, payment_method: data.paymentMethod,
      tax_price: Math.round(taxPrice * 100) / 100, shipping_price: Math.round(shippingPrice * 100) / 100,
      total_price: Math.round(totalPrice * 100) / 100, status: 'pending',
    }).select('*, order_items(*), users:user_id(name, email)').single();
    if (orderError) throw { response: { data: { message: orderError.message } } };
    const orderItems = items.map((i: any) => ({
      order_id: order.id, product_id: i.product_id, name: i.name, image: i.image, price: Number(i.price), quantity: i.quantity,
    }));
    const { error: itemsError } = await db.from('order_items').insert(orderItems);
    if (itemsError) throw { response: { data: { message: itemsError.message } } };
    for (const item of items) {
      await db.rpc('decrement_stock', { pid: item.product_id, qty: item.quantity });
    }
    await db.from('cart_items').delete().eq('cart_id', cart.id);
    return { data: { success: true, data: mapOrder(order) } };
  },

  getMine: async () => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Not authenticated' } } };
    const { data: orders, error } = await db.from('orders').select('*, order_items(*), users:user_id(name, email)').eq('user_id', uid).order('created_at', { ascending: false });
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: (orders || []).map(mapOrder) } };
  },

  getById: async (id: string) => {
    const { data: order, error } = await db.from('orders').select('*, order_items(*), users:user_id(name, email)').eq('id', id).single();
    if (error) throw { response: { data: { message: 'Order not found' } } };
    return { data: { success: true, data: mapOrder(order) } };
  },

  getAll: async () => {
    const { data: orders, error } = await db.from('orders').select('*, order_items(*), users:user_id(name, email)').order('created_at', { ascending: false });
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: (orders || []).map(mapOrder) } };
  },

  updateStatus: async (id: string, data: { status?: string; isDelivered?: boolean }) => {
    const updates: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    if (data.isDelivered) updates.delivered_at = new Date().toISOString();
    const { error } = await db.from('orders').update(updates).eq('id', id);
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true } };
  },

  pay: async (id: string, payData: unknown) => {
    const { error } = await db.from('orders').update({
      is_paid: true, paid_at: new Date().toISOString(), payment_result: payData, updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true } };
  },
};

// ==================== CATEGORIES ====================

export const categoryAPI = {
  getAll: async () => {
    const { data: categories, error } = await db.from('categories').select('*').order('name');
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: mapCategories(categories || []) as unknown as Category[] } };
  },

  create: async (data: { name: string; slug: string; image?: string }) => {
    const { data: cat, error } = await db.from('categories').insert(data).select().single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: mapCategory(cat) as any } };
  },
};

// ==================== WISHLIST ====================

export const wishlistAPI = {
  get: async () => {
    const uid = currentUserId();
    if (!uid) return { data: { success: true, data: { _id: '', user: '', products: [] } } };
    let { data: wl } = await db.from('wishlists').select('*').eq('user_id', uid).maybeSingle();
    if (!wl) {
      const { data: newWl } = await db.from('wishlists').insert({ user_id: uid }).select().single();
      wl = newWl;
    }
    if (!wl) return { data: { success: true, data: { _id: '', user: '', products: [] } } };
    const { data: wps } = await db.from('wishlist_products').select('*, products(*)').eq('wishlist_id', wl.id);
    const products = (wps || []).map((wp: any) => {
      const p = wp.products;
      return p ? mapProduct(p) : wp.product_id;
    });
    return { data: { success: true, data: { _id: wl.id, user: uid, products } } };
  },

  add: async (productId: string) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Login required' } } };
    let { data: wl } = await db.from('wishlists').select('*').eq('user_id', uid).maybeSingle();
    if (!wl) {
      const { data: newWl } = await db.from('wishlists').insert({ user_id: uid }).select().single();
      wl = newWl;
    }
    if (!wl) throw { response: { data: { message: 'Failed to create wishlist' } } };
    const { data: existing } = await db.from('wishlist_products').select('id').eq('wishlist_id', wl.id).eq('product_id', productId).maybeSingle();
    if (!existing) await db.from('wishlist_products').insert({ wishlist_id: wl.id, product_id: productId });
    return { data: { success: true } };
  },

  remove: async (productId: string) => {
    const uid = currentUserId();
    if (!uid) throw { response: { data: { message: 'Login required' } } };
    const { data: wl } = await db.from('wishlists').select('id').eq('user_id', uid).single();
    if (wl) await db.from('wishlist_products').delete().eq('wishlist_id', wl.id).eq('product_id', productId);
    return { data: { success: true } };
  },
};

// ==================== ADMIN ====================

export const adminAPI = {
  getUsers: async () => {
    const { data: users, error } = await db.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: false });
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: (users || []).map((u: any) => ({ _id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at })) } };
  },

  updateUserRole: async (userId: string, role: string) => {
    const { data: user, error } = await db.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', userId).select('id, name, email, role').single();
    if (error) throw { response: { data: { message: error.message } } };
    return { data: { success: true, data: { _id: user.id, name: user.name, email: user.email, role: user.role } } };
  },

  getStats: async () => {
    const [{ count: userCount }, { count: productCount }, { count: orderCount }, { data: revenueData }] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }),
      db.from('products').select('*', { count: 'exact', head: true }),
      db.from('orders').select('*', { count: 'exact', head: true }),
      db.from('orders').select('total_price').eq('is_paid', true),
    ]);
    const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + Number(o.total_price || 0), 0);
    return { data: { success: true, data: { totalUsers: userCount || 0, totalProducts: productCount || 0, totalOrders: orderCount || 0, totalRevenue: Math.round(totalRevenue * 100) / 100 } } };
  },

  createAdmin: async (data: { name: string; email: string; password: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { data: { name: data.name, role: 'admin' } } });
    if (authError) throw { response: { data: { message: authError.message?.includes('already') ? 'User already exists' : authError.message } } };
    if (!authData?.user) throw { response: { data: { message: 'Failed to create user' } } };
    const { data: user, error: dbError } = await db.from('users').insert({ id: authData.user.id, name: data.name, email: data.email, role: 'admin' }).select('id, name, email, role').single();
    if (dbError) throw { response: { data: { message: 'Failed to create admin profile' } } };
    return { data: { success: true, data: { _id: user.id, name: user.name, email: user.email, role: user.role } } };
  },
};

export default supabase;