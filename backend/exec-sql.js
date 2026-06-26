const https = require('https');

const PROJECT_REF = 'tfaubgfyxbcqdiadzgrv';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmYXViZ2Z5eGJjcWRpYWR6Z3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIzMDY4OSwiZXhwIjoyMDk1ODA2Njg5fQ.Et_GIKv4T5gLsERuHbktfTbRiwh5XMYPtzyYItDEJ7o';

const sql = `CREATE TABLE IF NOT EXISTS test_conn (id serial primary key, name text);`;

const body = JSON.stringify({ query: sql });

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
      console.log('Status:', res.statusCode);
      console.log('Response:', data.substring(0, 500));
    });
  }
);
req.on('error', (e) => console.error('Error:', e.message));
req.write(body);
req.end();
