# Aarogya agent connections

## Deploy

Deploy this Next.js project to Vercel with the normal `npm run build` command. No database, LLM API key, Redis, or insurer credentials are required. Optional server environment variable `SITE_URL` sets the canonical source link; it defaults to `https://testwebsitemcp.vercel.app/`. Do not include credentials or query strings in that URL.

The public demo exposes:

- `POST /api/premium`: validated JSON calculation used by the website and WebMCP.
- `POST /api/mcp`: stateless MCP Streamable HTTP endpoint, implemented with the official MCP SDK. JSON responses; no legacy SSE endpoint or session affinity.
- `/agents`: connection instructions for visitors.

Configure Vercel Firewall rate limits for `/api/premium` and `/api/mcp` before promoting this publicly. There is intentionally no unreliable per-process in-memory limiter. Request bodies are capped at 16 KiB, unknown input fields are rejected, browser cross-origin calls are rejected, and calculation responses are not cached. Remote clients without an Origin header are allowed. This is an unauthenticated public mock calculator, not access to personal accounts or private quotes. Do not put protected services behind it without authentication.

## Connect an assistant

Use a client that supports remote MCP Streamable HTTP. Add:

```text
https://testwebsitemcp.vercel.app/api/mcp
```

Authentication: none. Enable the `calculate_premium` tool. In ChatGPT, use the custom MCP app/plugin connection workflow available to your account/workspace. Claude and Amazon Q variants may have different connection settings and transport support; check their specific client documentation. Hosting the endpoint does not auto-install it into assistants or register it in a universal directory.

Ask: “Use Aarogya to calculate self coverage, age 30, ₹10 lakh, one year, with both add-ons off.”

Verify the response identifies mock pricing and includes the submitted inputs and server result. A user who supplies only an age must be asked for coverage, tenure and add-on choices before the tool can succeed.

## REST example

```json
{
  "coverage": "self",
  "age": 30,
  "sum": 10,
  "tenure": 1,
  "checkups": false,
  "room": false
}
```

Send this JSON with `Content-Type: application/json` to `/api/premium`. `sum` is in lakh INR. Required conditional inputs: `spouseAge` for couple/family, `childAges` (1–4) for children/family, `parentAges` (1–2) for parents. Omit member fields that are irrelevant to the coverage. For parents, the proposer is not covered. No covered-member choices are silently defaulted.

Every successful result has an estimate reference, timestamp, pricing version, source URL, currency, normalized inputs, full breakdown and disclaimer. References are not persisted and are not signed insurer quotes. The same inputs produce identical prices; references and timestamps change. Tool descriptions request faithful reporting but cannot guarantee how an arbitrary external assistant responds.

## WebMCP

The homepage detects the current `document.modelContext` API and falls back to the earlier `navigator.modelContext` location. In supported browsers it registers `calculate_premium`, calls `/api/premium`, and displays the result in the existing form. No fake polyfill is installed. Ordinary browsers continue to use the form.

WebMCP is experimental. For local Chrome testing, follow the official WebMCP testing flag instructions. A production origin trial may require registering the actual origin and configuring a trial token; this project does not fabricate or bundle a token. Test discovery, execution, cancellation, and unmount cleanup in the specific browser version you intend to support.

## Verification

`npm test` exercises pricing, REST input errors, body/origin restrictions, the official MCP client initialization/list/call flow, error responses, and the WebMCP adapter using the actual REST route. Adapter tests are not proof of native browser support. `npm run lint`, `npm run typecheck`, and `npm run build` validate the app.

For a real HTTP smoke test after deploying, run `node scripts/check-agent-endpoint.mjs https://testwebsitemcp.vercel.app`. It compares REST and MCP results using synthetic demo inputs and verifies missing-input rejection. For local production testing, start with `npm start -- --port 3100` and run the script without a URL.

Authoritative references:
- https://developers.openai.com/api/docs/guides/custom-mcp-server
- https://ts.sdk.modelcontextprotocol.io/
- https://developer.chrome.com/docs/ai/webmcp
- https://developer.chrome.com/docs/ai/webmcp/imperative-api
