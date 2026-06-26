const { spawn } = require('child_process');

const proc = spawn('cmd.exe', [
  '/c', 'npx', '-y',
  '@supabase/mcp-server-supabase@latest',
  '--access-token',
  'sbp_c83663a9e933e35a82d026d45a1c8e46c36afb26',
]);

let buf = '';
let msgId = 0;
const pending = {};

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  const lines = buf.split('\n');
  buf = lines.pop();
  for (const l of lines) {
    if (!l.trim()) continue;
    try {
      const m = JSON.parse(l);
      if (pending[m.id]) pending[m.id](m);
    } catch {}
  }
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending[id] = resolve;
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

(async () => {
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1' },
  });
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
  await new Promise((r) => setTimeout(r, 500));

  const r = await send('tools/call', {
    name: 'execute_sql',
    arguments: {
      project_id: 'tfaubgfyxbcqdiadzgrv',
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
    },
  });

  console.log('Full response:', JSON.stringify(r.result).substring(0, 1000));
  const text = r.result?.content?.[0]?.text || r.result?.content?.[0] || '[]';
  console.log('Raw text:', text?.substring(0, 500));
  let data = [];
  try { data = JSON.parse(text); } catch { data = text; }
  if (Array.isArray(data)) {
    console.log('Tables in public schema:');
    data.forEach((t) => console.log(' -', t.table_name));
  } else {
    console.log('Response data type:', typeof data, data);
  }

  proc.stdin.end();
  setTimeout(() => process.exit(0), 1000);
})();
