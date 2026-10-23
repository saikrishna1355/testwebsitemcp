import { NextResponse } from "next/server";
import { calculatePremium } from "@/lib/insurance";

// CORS so an MCP server (or any client) running elsewhere can call this.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * POST /api/calculate-premium
 * Body (JSON):
 *   {
 *     "productId": "life-term-20",   // required
 *     "coverage": 500000,             // required, INR
 *     "age": 25,                      // required
 *     "term": 20,                     // optional, default 1
 *     "smoker": false                 // optional, default false
 *   }
 *
 * Runs the website's real premium math and returns the exact quote. This is the
 * endpoint the MCP server calls so a connected agent never has to guess.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400, headers: CORS }
    );
  }

  const quote = calculatePremium(body || {});
  const status = quote.ok ? 200 : 400;
  return NextResponse.json(quote, { status, headers: CORS });
}
