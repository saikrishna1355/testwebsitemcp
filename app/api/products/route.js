import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/insurance";

// CORS so an MCP server (or any client) running elsewhere can call this.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * GET /api/products
 * Optional query params:
 *   ?query=life          free-text keyword
 *   ?category=life       one of: all | life | health | auto | home
 *
 * Returns the public product catalog of the Shriram Website. This is the
 * single source of truth that the MCP server reads from.
 */
export function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";

  const results = searchProducts({ query, category });

  const products = results.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    description: p.description,
    minCoverage: p.minCoverage,
    maxCoverage: p.maxCoverage,
    minAge: p.minAge,
    maxAge: p.maxAge,
    currency: "INR",
  }));

  return NextResponse.json({ count: products.length, products }, { headers: CORS });
}
