# Shriram Website

A Next.js (App Router) insurance site with a **premium calculator** that loads
with a default plan, plus a **WebMCP** integration so an AI agent such as Kiro
can calculate premiums directly instead of poking at the form.

## Run

```bash
cd shriram-website
npm install
npm run dev     # http://localhost:3000
```

> Run `npm run dev` yourself in a terminal — it is a long-running process.

## Premium calculator

The home page (`app/page.js`) renders a calculator pre-filled with the default
plan defined in `lib/insurance.js`:

| Field | Default |
|---|---|
| Plan | Term Life 20 (`life-term-20`) |
| Coverage | ₹500,000 |
| Age | 30 |
| Term | 20 years |
| Smoker | No |

With the default plan the calculated premium is:

- Risk multiplier: **1.1×**
- Monthly premium: **₹55**
- Annual premium: **₹660**
- Total for the 20-year term: **₹13,200**

The premium math lives in `lib/insurance.js` and mirrors the MCP server
(`../mcp-server/insurance.js`) so the browser UI and the agent tools stay in
sync.

## Web MCP

There are two complementary layers:

1. **In-page WebMCP** (`app/WebMcp.js`) — registers the page's operations as
   structured, agent-callable tools via the browser-native
   `navigator.modelContext` API (with a small polyfill so it works today):
   - `calculate_premium` — calculate a premium from JSON input; the result is
     also reflected back into the visible UI.
   - `list_insurance_products` — list available products.

2. **Kiro MCP server** (`../mcp-server`) — a stdio MCP server already wired into
   this workspace at `.kiro/settings/mcp.json` under the `insurance` entry, with
   `calculate_premium` auto-approved. This is how Kiro calculates premiums for
   you from chat.

### Calculate the premium from Kiro

Ask Kiro, for example:

> Calculate the premium for the default plan (life-term-20, coverage 500000,
> age 30, term 20, non-smoker).

Kiro calls the `calculate_premium` tool on the `insurance` MCP server and
returns the quote.
