const { spawn } = require('child_process');
const fs = require('fs');

const sql = fs.readFileSync(__dirname + '/supabase-schema.sql', 'utf-8');

const proc = spawn('cmd.exe', ['/c', 'npx', '-y', '@supabase/mcp-server-supabase@latest', '--access-token', 'sbp_c83663a9e933e35a82d026d45a1c8e46c36afb26'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: __dirname,
});

let msgId = 0;
let buf = '';
const pending = {};

proc.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  const lines = buf.split('\n');
  buf = lines.pop();
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      const resolve = pending[msg.id];
      if (resolve) {
        delete pending[msg.id];
        resolve(msg);
      }
    } catch (e) {
      console.error('Parse error:', e.message, line.substring(0, 200));
    }
  }
});

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = ++msgId;
    pending[id] = resolve;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params });
    proc.stdin.write(msg + '\n');
  });
}

async function main() {
  // Initialize
  const init = await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'migration-script', version: '1.0.0' },
  });
  console.log('Initialized:', JSON.stringify(init).substring(0, 200));

  // Send initialized notification
  proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // Wait a moment for server to be ready
  await new Promise(r => setTimeout(r, 1000));

  // List tools
  const tools = await send('tools/list');
  const toolNames = tools.result?.tools?.map(t => t.name) || [];
  console.log('Available tools:', toolNames.join(', '));

  // Find SQL execution tool
  const sqlTool = toolNames.find(t => t.includes('sql') || t.includes('query') || t.includes('run'));
  if (sqlTool) {
    console.log(`\nUsing tool: ${sqlTool}`);
    console.log('Executing migration SQL...');

    // Send entire migration as one SQL block
    console.log('\nSending entire migration SQL as one block...');
    const r = await send('tools/call', {
      name: sqlTool,
      arguments: { project_id: 'tfaubgfyxbcqdiadzgrv', query: sql },
    });

    if (r.error) {
      console.error('  Error:', r.error.message?.substring(0, 500) || JSON.stringify(r.error));
    } else {
      const content = r.result?.content?.[0]?.text || '';
      const isError = r.result?.isError;
      if (isError) {
        console.error('  SQL Error:', content.substring(0, 500));
      } else {
        console.log('  Migration executed successfully');
        console.log('  Response:', content.substring(0, 300));
      }
    }

    console.log('\nMigration complete!');
  } else {
    console.log('\nNo SQL tool found. Available tools:', toolNames.join(', '));
  }

  proc.stdin.end();
  setTimeout(() => process.exit(0), 2000);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
