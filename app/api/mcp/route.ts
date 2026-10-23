import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/agents/mcp-server';
import { checkOrigin, HttpError, privateHeaders } from '@/lib/agents/http';

export const runtime = 'nodejs';
export const maxDuration = 30;
export async function POST(request: Request) {
  try { checkOrigin(request); } catch (error) {
    return Response.json({ error: error instanceof HttpError ? error.message : 'Forbidden' }, { status: 403, headers: privateHeaders });
  }
  // A fresh stateless transport per request works across Vercel function instances.
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true, maxRequestBodySize: 16_384 });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    // Buffer the finite JSON response before closing the request-scoped transport.
    const body = await response.arrayBuffer();
    const headers = new Headers(response.headers);
    Object.entries(privateHeaders).forEach(([key, value]) => headers.set(key, value));
    return new Response(body.byteLength ? body : null, { status: response.status, headers });
  } finally { await server.close(); }
}
export function GET() {
  return new Response('This stateless MCP endpoint accepts POST requests. Setup instructions: /agents', { status: 405, headers: { ...privateHeaders, Allow: 'POST' } });
}
export const DELETE = GET;
