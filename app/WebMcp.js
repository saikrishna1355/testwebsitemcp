"use client";

/**
 * In-page WebMCP integration for the Shriram Website.
 *
 * Registers the page's operations as structured, agent-callable tools via the
 * browser-native WebMCP imperative API. Per the current spec the entry point is
 * `document.modelContext.registerTool(tool)`; an earlier draft exposed it as
 * `navigator.modelContext`, so we fall back to that, and only install a tiny
 * polyfill when neither is present (so the tools are still inspectable in a
 * browser that doesn't ship the API yet).
 *
 * Reference: https://developer.chrome.com/docs/ai/webmcp/imperative-api
 *
 * Registered tools:
 *   - calculate_premium          calculate a premium from JSON input; the
 *                                visible calculator is updated to match.
 *   - list_insurance_products    list the available products (read-only).
 *   - search_insurance_products  search products by keyword/category (read-only).
 *
 * The premium/search math is imported from lib/insurance.js — the single source
 * of truth the HTTP API and the MCP server also use — so every surface stays in
 * sync.
 */

import { useEffect } from "react";
import { PRODUCTS, calculatePremium, searchProducts } from "@/lib/insurance";

/**
 * Resolve the live modelContext the browser (or a WebMCP extension) exposes.
 *
 * Order of preference:
 *   1. document.modelContext   (current spec)
 *   2. navigator.modelContext  (earlier draft / some extensions)
 *   3. a minimal polyfill on document.modelContext so registration still works
 *      and tools are inspectable via getTools().
 *
 * Returning the real object is what makes a detector actually see the tools —
 * the previous version created its own object and shadowed the native one.
 */
function resolveModelContext() {
  if (typeof document !== "undefined" && document.modelContext) {
    return document.modelContext;
  }
  if (typeof navigator !== "undefined" && navigator.modelContext) {
    return navigator.modelContext;
  }
  if (typeof document === "undefined") return null;

  // Minimal spec-shaped polyfill (registerTool + getTools + toolchange event).
  const tools = new Map();
  const target = typeof EventTarget !== "undefined" ? new EventTarget() : null;

  const polyfill = {
    registerTool(tool, options = {}) {
      if (!tool || typeof tool.name !== "string") {
        throw new TypeError("registerTool requires a tool with a string name");
      }
      tools.set(tool.name, tool);
      target?.dispatchEvent(new Event("toolchange"));

      const remove = () => {
        if (tools.delete(tool.name)) {
          target?.dispatchEvent(new Event("toolchange"));
        }
      };
      // Support AbortSignal-based unregistration, like the real API.
      if (options.signal) {
        if (options.signal.aborted) remove();
        else options.signal.addEventListener("abort", remove, { once: true });
      }
      return remove;
    },
    async getTools() {
      return Array.from(tools.values())
        .map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
          annotations: t.annotations,
          origin: typeof location !== "undefined" ? location.origin : undefined,
          title: t.title || "",
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
    async executeTool(tool, input) {
      const entry = tools.get(typeof tool === "string" ? tool : tool?.name);
      if (!entry) throw new Error("Unknown tool");
      return entry.execute(input ?? {}, { signal: undefined });
    },
    addEventListener: (...a) => target?.addEventListener(...a),
    removeEventListener: (...a) => target?.removeEventListener(...a),
    dispatchEvent: (e) => target?.dispatchEvent(e),
  };

  try {
    Object.defineProperty(document, "modelContext", {
      value: polyfill,
      configurable: true,
      writable: true,
    });
  } catch {
    document.modelContext = polyfill;
  }
  return document.modelContext;
}

/**
 * Build the list of tool definitions this page exposes.
 *
 * @param {(input: object) => void} [onCalculate]
 */
function buildTools(onCalculate) {
  return [
    {
      name: "calculate_premium",
      description:
        "Calculate an insurance premium quote for a chosen Shriram plan using " +
        "the website's real pricing engine. Use this whenever a user wants to " +
        "know the cost of a policy for a given coverage amount, age, and term. " +
        "The on-page calculator is updated to match the quote.\n\n" +
        "Inputs: productId (which plan), coverage (sum assured in INR), age " +
        "(years), and optionally term (years) and smoker.\n\n" +
        "Output: a JSON string. On success: { ok: true, productId, " +
        "productName, coverage, age, term, smoker, riskMultiplier, " +
        "annualPremium, monthlyPremium, totalForTerm, currency } where all " +
        'amounts are numbers in INR and currency is "INR". On failure: ' +
        "{ ok: false, error } where error explains what to fix (for example " +
        "an age or coverage outside the plan's allowed range), so you can " +
        "retry with corrected values.",
      inputSchema: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            enum: PRODUCTS.map((p) => p.id),
            description:
              "The insurance plan to quote. Choose by matching the user's " +
              "intent to a plan, for example: " +
              PRODUCTS.map((p) => `${p.id} (${p.name}, ${p.category})`).join(
                "; ",
              ) +
              ". Use list_insurance_products if you need each plan's limits.",
          },
          coverage: {
            type: "number",
            description:
              "Sum assured in INR — the payout amount the policy covers. " +
              "Pass the raw amount as a number (for example 500000 for five " +
              "lakh), not a formatted string. Must fall within the chosen " +
              "plan's min/max coverage.",
          },
          age: {
            type: "number",
            description:
              "Age of the insured in whole years. Drives the risk multiplier " +
              "and must fall within the chosen plan's eligible age range.",
          },
          term: {
            type: "number",
            description:
              "Policy term in years, used to compute the total cost over the " +
              "life of the policy. Optional; defaults to 1 year if omitted.",
          },
          smoker: {
            type: "boolean",
            description:
              "Whether the insured smokes. Smokers carry a higher risk " +
              "multiplier. Optional; defaults to false (non-smoker).",
          },
        },
        required: ["productId", "coverage", "age"],
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: false,
        untrustedContentHint: false,
      },
      async execute(input = {}) {
        const result = calculatePremium(input);
        if (result.ok && typeof onCalculate === "function") {
          try {
            onCalculate(input);
          } catch {
            // Reflecting into the UI is best-effort.
          }
        }
        return JSON.stringify(result);
      },
    },
    {
      name: "list_insurance_products",
      description:
        "List the insurance products available on the Shriram Website, " +
        "including category, coverage limits, and eligible age range.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
      async execute() {
        const products = PRODUCTS.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description,
          minCoverage: p.minCoverage,
          maxCoverage: p.maxCoverage,
          minAge: p.minAge,
          maxAge: p.maxAge,
        }));
        return JSON.stringify(products);
      },
    },
    {
      name: "search_insurance_products",
      description:
        "Search the Shriram Website product catalog by free-text keyword " +
        "and/or category (life, health, auto, home).",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Free-text keyword to match name/description/category.",
          },
          category: {
            type: "string",
            description: "Category filter: life, health, auto, home, or all.",
          },
        },
      },
      annotations: { readOnlyHint: true },
      async execute(input = {}) {
        return JSON.stringify(searchProducts(input));
      },
    },
  ];
}

/**
 * Module-level registration state.
 *
 * The native `document.modelContext` registry persists across React remounts,
 * React 18 Strict Mode's dev double-invoke, and Fast Refresh module reloads.
 * None of those reset the browser's registry, so if we naively call
 * `registerTool` again we hit `InvalidStateError: Duplicate tool name`.
 *
 * To stay correct regardless of how many times this runs, we:
 *   1. serialize all registration work behind a single shared promise, and
 *   2. before adding a tool, check `getTools()` and skip names already present,
 *      and also treat a `Duplicate tool name` error as success (the tool is in
 *      the registry, which is the goal).
 *
 * `onCalculateRef` lets the already-registered calculate_premium tool call the
 * latest page callback without needing re-registration.
 */
let registrationChain = Promise.resolve();
const onCalculateRef = { current: null };

function isDuplicateError(err) {
  return (
    err &&
    (err.name === "InvalidStateError" ||
      /duplicate tool name/i.test(String(err.message || err)))
  );
}

/**
 * Ensure every tool is registered on the live modelContext exactly once.
 * Safe to call repeatedly; concurrent calls are serialized.
 */
function ensureToolsRegistered() {
  // Chain onto the previous call so two invocations can't interleave and race
  // on the same tool name.
  registrationChain = registrationChain.then(doEnsure).catch((err) => {
    console.error("[WebMCP] registration error:", err);
  });
  return registrationChain;
}

async function doEnsure() {
  const mc = resolveModelContext();
  if (!mc || typeof mc.registerTool !== "function") {
    console.warn("[WebMCP] modelContext.registerTool unavailable; skipping.");
    return;
  }

  // What's already registered natively?
  let existing = new Set();
  try {
    const current = (await mc.getTools?.()) ?? [];
    existing = new Set(current.map((t) => t.name));
  } catch {
    // If getTools isn't available we fall back to duplicate-error handling.
  }

  // calculate_premium reads the latest page callback via the ref, so we never
  // need to re-register it just because the callback identity changed.
  const tools = buildTools((input) => onCalculateRef.current?.(input));

  for (const tool of tools) {
    if (existing.has(tool.name)) continue; // already registered; leave it.
    try {
      await mc.registerTool(tool);
    } catch (err) {
      if (isDuplicateError(err)) {
        // Already in the registry from a prior load — that's fine.
        continue;
      }
      console.error(`[WebMCP] Failed to register "${tool.name}":`, err);
    }
  }

  try {
    const registered = (await mc.getTools?.()) ?? [];
    console.info(
      "[WebMCP] Registered tools:",
      registered.map((t) => t.name),
    );
  } catch {
    // getTools is optional; ignore.
  }
}

/**
 * Drop-in component that registers the WebMCP tools once the browser's
 * modelContext is available. Renders nothing.
 *
 * Registration is intentionally NOT torn down on unmount: the tools describe
 * the page's capabilities for the lifetime of the document, and tearing them
 * down on a Strict Mode remount is exactly what caused the duplicate-name race.
 *
 * @param {{ onCalculate?: (input: object) => void }} props
 */
export default function WebMcp({ onCalculate }) {
  // Keep the latest callback available to the already-registered tool.
  onCalculateRef.current = onCalculate ?? null;

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Wait up to ~2s for a modelContext to appear (native API or an
      // extension-injected one) before falling back to the polyfill.
      for (let i = 0; i < 20; i++) {
        if (
          (typeof document !== "undefined" && document.modelContext) ||
          (typeof navigator !== "undefined" && navigator.modelContext)
        ) {
          break;
        }
        await new Promise((r) => setTimeout(r, 100));
        if (cancelled) return;
      }
      if (!cancelled) ensureToolsRegistered();
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
