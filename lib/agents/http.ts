const MAX_BODY_BYTES = 16_384;
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new HttpError(415, 'Use Content-Type: application/json.');
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new HttpError(413, 'Request too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) { await reader.cancel(); throw new HttpError(413, 'Request too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, 'Malformed JSON.'); }
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  // Remote MCP clients typically send no Origin. Browser requests must be same-origin.
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Cross-origin browser requests are not allowed.');
}
export const privateHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
