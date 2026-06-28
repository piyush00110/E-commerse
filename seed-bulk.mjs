import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const supabaseUrl = 'https://tfaubgfyxbcqdiadzgrv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYXViZ2Z5eGJjcWRpYWR6Z3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzA2ODksImV4cCI6MjA5NTgwNjY4OX0.wJL9vW2wmDgRIpPAuHklPVyTqru7sHKZ45r86R_vJAQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Login as admin
const { error: loginError } = await supabase.auth.signInWithPassword({
  email: 'admin@shop.com',
  password: 'admin123',
});
if (loginError) {
  console.error('Login failed:', loginError.message);
  process.exit(1);
}
console.log('Logged in as admin');

// Read the batch files
const products = [];
for (let i = 1; i <= 5; i++) {
  const sql = readFileSync(join(__dirname, `seed_batch_${i}.sql`), 'utf8');
  const headerEnd = sql.indexOf('VALUES\n') + 7;
  const body = sql.slice(headerEnd, sql.lastIndexOf(';\n'));
  const rows = body.split(',\n');
  for (const row of rows) {
    // Parse the INSERT row manually
    const match = row.match(/^\(gen_random_uuid\(\)\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*([\d.]+)\s*,\s*([\d.]+|NULL)\s*,\s*ARRAY\[(.*?)\]::text\[\]\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*(\d+)\s*,\s*([\d.]+)\s*,\s*(\d+)\s*,\s*ARRAY\[(.*?)\]::text\[\]\s*,\s*(true|false)\s*,\s*NOW\(\)\s*,\s*NOW\(\)\)$/s);
    if (!match) {
      console.error('Could not parse row:', row.slice(0, 100));
      continue;
    }
    const [, name, desc, price, comparePrice, imagesStr, catId, brand, stock, rating, reviews, featuresStr, featured] = match;
    const images = imagesStr.split(',').map(s => s.replace(/^'|'$/g, '').replace(/''/g, "'"));
    const features = featuresStr.split(',').map(s => s.replace(/^'|'$/g, '').replace(/''/g, "'"));
    products.push({
      name: name.replace(/''/g, "'"),
      description: desc.replace(/''/g, "'"),
      price: parseFloat(price),
      compare_price: comparePrice === 'NULL' ? null : parseFloat(comparePrice),
      images,
      category_id: catId,
      brand,
      count_in_stock: parseInt(stock),
      rating: parseFloat(rating),
      num_reviews: parseInt(reviews),
      features,
      is_featured: featured === 'true',
    });
  }
}

console.log(`Parsed ${products.length} products`);

// Insert in batches
const BATCH = 50;
let inserted = 0;
for (let i = 0; i < products.length; i += BATCH) {
  const batch = products.slice(i, i + BATCH);
  const { error } = await supabase.from('products').insert(batch);
  if (error) {
    console.error(`Batch ${i / BATCH + 1} failed:`, error.message);
    process.exit(1);
  }
  inserted += batch.length;
  console.log(`Inserted batch ${i / BATCH + 1}/${Math.ceil(products.length / BATCH)}: ${inserted}/${products.length}`);
}

const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
console.log(`\nDone! Total products in database: ${count}`);

process.exit(0);
