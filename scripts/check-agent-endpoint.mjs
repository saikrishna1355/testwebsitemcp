import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const base = process.argv[2] || 'http://localhost:3100';
const input = { coverage: 'self', age: 30, sum: 10, tenure: 1, checkups: false, room: false };
const response = await fetch(new URL('/api/premium', base), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
assert.equal(response.status, 200, 'Premium API must return 200');
const rest = await response.json();
const client = new Client({ name: 'Shriram-deployment-check', version: '1.0.0' });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL('/api/mcp', base)));
  const tools = await client.listTools();
  assert.ok(tools.tools.some(tool => tool.name === 'calculate_premium'));
  const result = await client.callTool({ name: 'calculate_premium', arguments: input });
  assert.deepEqual(result.structuredContent.estimate, rest.estimate);
  assert.equal(result.structuredContent.illustrative, true);
  const invalid = await client.callTool({ name: 'calculate_premium', arguments: { age: 30 } });
  assert.equal(invalid.isError, true);
  console.log(JSON.stringify({ server: base, tool: 'calculate_premium', annual: rest.estimate.annual, currency: rest.currency, restAndMcpMatch: true, invalidInputRejected: true }));
} finally { await client.close(); }
