const fs = require('fs');
const sql = fs.readFileSync('seed_products.sql', 'utf8');

const header = `INSERT INTO public.products (id, name, description, price, compare_price, images, category_id, brand, count_in_stock, rating, num_reviews, features, is_featured, created_at, updated_at)\nVALUES\n`;

const body = sql.slice(header.length, sql.lastIndexOf(';'));
const rows = body.split(',\n');

const BATCH = 100;
const totalBatches = Math.ceil(rows.length / BATCH);

for (let i = 0; i < totalBatches; i++) {
  const batchRows = rows.slice(i * BATCH, (i + 1) * BATCH);
  const batchSql = header + batchRows.join(',\n') + ';\n';
  const fname = `seed_batch_${i + 1}.sql`;
  fs.writeFileSync(fname, batchSql);
  console.log(`Written ${fname}: ${batchRows.length} rows (${batchSql.length} bytes)`);
}

console.log(`\nDone: ${totalBatches} batch files created.`);
