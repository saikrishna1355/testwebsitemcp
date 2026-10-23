# Aarogya

A responsive Next.js App Router health-insurance concept with a four-step illustrative premium calculator. Built with TypeScript, Tailwind CSS, Lucide, React Hook Form and Zod. The family artwork is an original inline SVG; there are no remote fonts or image requests. CSS handles lightweight animation and respects reduced-motion preferences.

## Run

Requires Node.js 20.9+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. On Windows with PowerShell script restrictions, use `npm.cmd` instead of `npm`.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Structure

- `app/`: landing page, metadata, global design tokens, privacy and terms pages.
- `components/layout/`: responsive navigation and footer.
- `components/sections/`: hero illustration, benefits, coverage, journey, FAQ and final CTA.
- `components/calculator/`: conditional four-step form, inline validation and estimate breakdown.
- `lib/validation/premium-schema.ts`: shared Zod input rules.
- `lib/pricing/premium-calculator.ts`: deterministic pricing and configurable `MOCK_PRICING`.
- `lib/constants/insurance.ts`, `types/insurance.ts`: options, currency formatting and types.
- `tests/premium.test.ts`: pricing, member selection, tenure and validation tests.

## Mock model

An age-adjusted base is scaled by the square root of selected coverage / ₹3 lakh. Additional covered adults use the same age bands; children use a fixed illustrative member rate. Add-ons are annual per-policy amounts. No tax or tenure discount is included. Full tenure total is annual premium × years; monthly equivalent is not an instalment offer. For parents coverage, the proposer is not insured. Input ages are demo bounds, not eligibility statements.

All brand, product and pricing information is fictional. No authentication, payment, analytics, database or insurer integration is implemented. Calculation inputs are sent to the shared server API and are not persisted by the application. Sign In explains preview availability; Get Started offers a printable review. Actual insurance terms and taxes must be confirmed with an insurer.

## Agent access

The website, remote MCP tool, and browser WebMCP integration share the server calculation. See [agent setup](docs/agent-setup.md) for deployment, client configuration, API inputs, and compatibility limits. New endpoints: `/api/premium`, `/api/mcp`, and `/agents`.
