import { supabase, supabaseAdmin } from './config/supabase';

const seed = async (): Promise<void> => {
  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
  if (count && count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const adminUser = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@shop.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { name: 'Admin', role: 'admin' },
  });

  const testUser = await supabaseAdmin.auth.admin.createUser({
    email: 'user@shop.com',
    password: 'user123',
    email_confirm: true,
    user_metadata: { name: 'Test User', role: 'user' },
  });

  if (adminUser.data.user && testUser.data.user) {
    await supabase.from('users').insert([
      { id: adminUser.data.user.id, name: 'Admin', email: 'admin@shop.com', role: 'admin' },
      { id: testUser.data.user.id, name: 'Test User', email: 'user@shop.com', role: 'user' },
    ]);
  }

  const { data: categories } = await supabase.from('categories').insert([
    { name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400' },
    { name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?w=400' },
    { name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors', image: 'https://images.unsplash.com/photo-1461896836934-bd45ba8fcf9b?w=400' },
  ]).select();

  if (!categories) return;
  const catMap: Record<string, string> = {};
  categories.forEach((c: any) => { catMap[c.slug] = c.id; });

  await supabase.from('products').insert([
    { name: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with active noise cancellation, 40-hour battery life.', price: 249.99, compare_price: 329.99, images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'], category_id: catMap['electronics'], brand: 'SoundPro', count_in_stock: 45, rating: 4.5, num_reviews: 12453, features: ['Active Noise Cancellation', '40-hour battery', 'Crystal clear calls'], is_featured: true },
    { name: 'SmartWatch Pro X2', description: 'Advanced smartwatch with health monitoring, GPS tracking, and 14-day battery life.', price: 199.99, compare_price: 259.99, images: ['https://images.unsplash.com/photo-1546868871-af0de0ae72a5?w=600'], category_id: catMap['electronics'], brand: 'TechWear', count_in_stock: 78, rating: 4.3, num_reviews: 8765, features: ['Heart rate monitoring', 'GPS tracking', '14-day battery'], is_featured: true },
    { name: '4K Ultra HD Smart TV 55"', description: 'Stunning 4K resolution with HDR10+ support. Smart platform with built-in streaming apps.', price: 549.99, compare_price: 699.99, images: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600'], category_id: catMap['electronics'], brand: 'ViewTech', count_in_stock: 23, rating: 4.6, num_reviews: 4521, is_featured: true },
    { name: 'Premium Cotton Casual Shirt', description: '100% organic cotton casual shirt. Comfortable fit for daily wear.', price: 39.99, compare_price: 59.99, images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'], category_id: catMap['fashion'], brand: 'UrbanStyle', count_in_stock: 150, rating: 4.2, num_reviews: 3210, features: ['100% Organic Cotton', 'Regular Fit', 'Machine Washable'], is_featured: true },
    { name: 'Designer Leather Jacket', description: 'Genuine leather jacket with modern design. Zippered pockets.', price: 189.99, compare_price: 249.99, images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'], category_id: catMap['fashion'], brand: 'EliteWear', count_in_stock: 35, rating: 4.4, num_reviews: 1876, is_featured: true },
    { name: 'Professional Chef Knife Set', description: '8-piece professional kitchen knife set with high-carbon stainless steel.', price: 89.99, compare_price: 129.99, images: ['https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600'], category_id: catMap['home-kitchen'], brand: 'ChefMaster', count_in_stock: 67, rating: 4.7, num_reviews: 6543, features: ['High-carbon stainless steel', 'Ergonomic handles'], is_featured: true },
    { name: 'Wireless Bluetooth Earbuds', description: 'True wireless earbuds with ANC. 8 hours playtime, IPX5.', price: 79.99, compare_price: 99.99, images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f75?w=600'], category_id: catMap['electronics'], brand: 'SoundPro', count_in_stock: 180, rating: 4.3, num_reviews: 15432, is_featured: true },
    { name: 'Organic Skincare Set', description: 'Complete skincare routine with cleanser, serum, moisturizer, and sunscreen.', price: 59.99, compare_price: 84.99, images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600'], category_id: catMap['beauty'], brand: 'GlowNaturals', count_in_stock: 90, rating: 4.4, num_reviews: 5432, is_featured: true },
    { name: 'Mechanical Gaming Keyboard', description: 'RGB mechanical keyboard with Cherry MX switches. Aluminum frame.', price: 129.99, compare_price: 169.99, images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600'], category_id: catMap['electronics'], brand: 'GameTech', count_in_stock: 88, rating: 4.5, num_reviews: 6789, is_featured: true },
    { name: 'Yoga Mat Premium', description: 'Extra thick 6mm yoga mat with alignment lines. Non-slip surface.', price: 34.99, compare_price: 44.99, images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'], category_id: catMap['sports-outdoors'], brand: 'FlexFit', count_in_stock: 120, rating: 4.5, num_reviews: 2345, is_featured: false },
  ]);

  console.log('Seed completed!');
};

seed().catch(console.error);