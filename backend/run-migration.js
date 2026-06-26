const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'tfaubgfyxbcqdiadzgrv';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYXViZ2Z5eGJjcWRpYWR6Z3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIzMDY4OSwiZXhwIjoyMDk1ODA2Njg5fQ.Et_GIKv4T5gLsERuHbktfTbRiwh5XMYPtzyYItDEJ7o';

const sql = fs.readFileSync(__dirname + '/supabase-schema.sql', 'utf-8');

// Split by semicolons to execute statements one by one
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function execute() {
  for (const stmt of statements) {
    const body = JSON.stringify({ query: stmt + ';' });
    console.log('Executing:', stmt.substring(0, 80) + '...');

    await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => data += c);
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log('  OK');
            } else {
              console.log(`  Error ${res.statusCode}: ${data.substring(0, 200)}`);
            }
            resolve();
          });
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
  console.log('\nMigration complete!');
}

execute().catch(console.error);
