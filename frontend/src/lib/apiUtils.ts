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
