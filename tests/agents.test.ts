import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { POST as premiumPost } from '../app/api/premium/route';
import { POST as mcpPost } from '../app/api/mcp/route';
import { createEstimate } from '../lib/agents/service';
import { registerPremiumTool, type ModelContext } from '../lib/agents/webmcp';
import { requestEstimate } from '../lib/agents/client';

const input = { coverage: 'self', age: 30, sum: 10, tenure: 1, checkups: false, room: false };
const request = (body: unknown, path = 'premium') => new Request(`http://localhost/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('HTTP API calculates, disables caching, and rejects incomplete or conflicting input', async () => {
  const response = await premiumPost(request(input));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const data = await response.json();
  assert.deepEqual(data.estimate, createEstimate(input).estimate);
  assert.equal(data.illustrative, true);
  for (const invalid of [{ age: 30 }, { ...input, coverage: 'couple' }, { ...input, spouseAge: 35 }, { ...input, age: '30' }, { ...input, medicalRecords: 'not accepted' }]) {
    const failed = await premiumPost(request(invalid));
    assert.equal(failed.status, 422);
    assert.equal((await failed.json()).estimate, undefined);
  }
});
test('HTTP boundary rejects malformed JSON, oversized payloads and untrusted origins', async () => {
  assert.equal((await premiumPost(new Request('http://localhost/api/premium', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal((await premiumPost(request({ padding: 'a'.repeat(17000) }))).status, 413);
  const crossOrigin = request(input); crossOrigin.headers.set('origin', 'https://untrusted.example');
  assert.equal((await premiumPost(crossOrigin)).status, 403);
});
test('official MCP client initializes, discovers tool and gets the same estimate as REST', async () => {
  const transport = new StreamableHTTPClientTransport(new URL('http://localhost/api/mcp'), {
    fetch: async (url, init) => mcpPost(new Request(url, init)),
  });
  const client = new Client({ name: 'Shriram-test-client', version: '1.0.0' });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.equal(tools.tools[0].name, 'calculate_premium');
    const result = await client.callTool({ name: 'calculate_premium', arguments: input });
    assert.equal(result.isError, undefined);
    assert.deepEqual((result.structuredContent as Record<string, unknown>)?.estimate, createEstimate(input).estimate);
    const failed = await client.callTool({ name: 'calculate_premium', arguments: { ...input, coverage: 'family' } });
    assert.equal(failed.isError, true);
    const missing = await client.callTool({ name: 'calculate_premium', arguments: { age: 30 } });
    assert.equal(missing.isError, true);
  } finally { await client.close(); }
});
test('WebMCP adapter executes the shared HTTP client, updates UI callback and unregisters', async () => {
  let tool: Parameters<ModelContext['registerTool']>[0] | undefined;
  let visible = false;
  let removed = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init) => premiumPost(new Request('http://localhost/api/premium', init));
  try {
    const cleanup = registerPremiumTool({ registerTool: t => { tool = t; }, unregisterTool: () => { removed = true; } }, result => { visible = true; assert.deepEqual(result.estimate, createEstimate(input).estimate); }, () => {}, requestEstimate);
    const data = JSON.parse(await tool!.execute(input));
    assert.equal(data.status, 'success');
    assert.equal(visible, true);
    await assert.rejects(tool!.execute({ age: 30 }));
    cleanup();
    assert.equal(removed, true);
    await assert.rejects(tool!.execute(input));
  } finally { globalThis.fetch = originalFetch; }
});
