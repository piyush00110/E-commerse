import https from 'node:https'

const STITCH_URL = 'https://stitch.googleapis.com/mcp'
const API_KEY = process.env.STITCH_API_KEY

function post(data) {
  process.stdout.write(JSON.stringify(data) + '\n')
}

function callStitch(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
    const req = https.request(STITCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Goog-Api-Key': API_KEY,
      },
    }, (res) => {
      let data = ''
      res.on('data', (c) => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

process.stdin.setEncoding('utf-8')
let buf = ''
process.stdin.on('data', (chunk) => {
  buf += chunk
  const lines = buf.split('\n')
  buf = lines.pop()
  for (const line of lines) {
    if (!line.trim()) continue
    let msg
    try { msg = JSON.parse(line) } catch { continue }

    if (msg.method === 'initialize') {
      post({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, logging: {} },
          serverInfo: { name: 'stitch-bridge', version: '1.0.0' },
        },
      })
      continue
    }

    if (msg.method === 'notifications/initialized') {
      continue
    }

    if (msg.method === 'tools/list') {
      callStitch('tools/list', {}).then((parsed) => {
        let tools = []
        if (parsed.result?.content?.[0]?.text) {
          try { tools = JSON.parse(parsed.result.content[0].text) } catch {}
        } else if (parsed.result?.tools) {
          tools = parsed.result.tools
        }
        post({ jsonrpc: '2.0', id: msg.id, result: { tools } })
      }).catch((e) => {
        post({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(e) } })
      })
      continue
    }

    if (msg.method === 'tools/call') {
      callStitch('tools/call', { name: msg.params.name, arguments: msg.params.arguments }).then((parsed) => {
        post({ jsonrpc: '2.0', id: msg.id, result: parsed.result || {} })
      }).catch((e) => {
        post({ jsonrpc: '2.0', id: msg.id, error: { code: -32603, message: String(e) } })
      })
      continue
    }

    post({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'not supported' } })
  }
})
