const snakeToCamel = (str: string): string =>
  str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export function mapProduct(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else if (key === 'category_id') {
      mapped.category = item[key];
    } else if (key === 'categories') {
      const cat = item[key] as Record<string, unknown> | null;
      if (cat) {
        mapped.category = { _id: cat.id, name: cat.name, slug: cat.slug };
      } else {
        mapped.category = item.category_id;
      }
    } else {
      mapped[snakeToCamel(key)] = item[key];
    }
  }
  return mapped;
}

export function mapProducts(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return (items || []).map(mapProduct);
}

export function mapUser(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}

export function mapCart(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else if (key === 'product_id') mapped.product = item[key];
    else if (key === 'user_id') mapped.user = item[key];
    else if (key === 'cart_items') {
      const items = item[key] as Record<string, unknown>[] | undefined;
      mapped.items = (items || []).map((ci: Record<string, unknown>) => ({
        ...ci,
        _id: ci.id,
        product: ci.product_id,
      }));
    } else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}

export function mapOrder(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else if (key === 'user_id') mapped.user = item[key];
    else if (key === 'users') mapped.user = item[key];
    else if (key === 'shipping_address') mapped.shippingAddress = item[key];
    else if (key === 'payment_method') mapped.paymentMethod = item[key];
    else if (key === 'tax_price') mapped.taxPrice = item[key];
    else if (key === 'shipping_price') mapped.shippingPrice = item[key];
    else if (key === 'total_price') mapped.totalPrice = item[key];
    else if (key === 'is_paid') mapped.isPaid = item[key];
    else if (key === 'paid_at') mapped.paidAt = item[key];
    else if (key === 'is_delivered') mapped.isDelivered = item[key];
    else if (key === 'delivered_at') mapped.deliveredAt = item[key];
    else if (key === 'order_items') {
      const items = item[key] as Record<string, unknown>[] | undefined;
      mapped.items = (items || []).map((i: Record<string, unknown>) => ({
        ...i,
        _id: i.id,
        product: i.product_id,
      }));
    } else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}

export function mapOrders(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return (items || []).map(mapOrder);
}

export function mapCategory(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}

export function mapCategories(items: Record<string, unknown>[]): Record<string, unknown>[] {
  return (items || []).map(mapCategory);
}

export function mapWishlist(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else if (key === 'user_id') mapped.user = item[key];
    else if (key === 'wishlist_products') {
      const wps = item[key] as Record<string, unknown>[] | undefined;
      mapped.products = (wps || []).map((wp: Record<string, unknown>) => {
        const prod = wp.products as Record<string, unknown> | undefined;
        return prod ? mapProduct(prod) : wp.product_id;
      });
    } else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}

export function mapReview(item: Record<string, unknown>): Record<string, unknown> {
  if (!item) return item;
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(item)) {
    if (key === 'id') mapped._id = item[key];
    else if (key === 'user_id') mapped.user = item[key];
    else if (key === 'product_id') mapped.product = item[key];
    else if (key === 'created_at') mapped.createdAt = item[key];
    else mapped[snakeToCamel(key)] = item[key];
  }
  return mapped;
}
