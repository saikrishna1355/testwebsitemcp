/**
 * Shared insurance domain logic for the Shriram Website.
 *
 * This mirrors the premium math used by the MCP server (mcp-server/insurance.js)
 * so the browser premium calculator and the agent-callable tools stay in sync.
 */

export const PRODUCTS = [
  {
    id: "life-term-20",
    name: "Term Life 20",
    category: "life",
    description: "20-year level term life insurance.",
    baseRate: 0.0012,
    minCoverage: 50000,
    maxCoverage: 2000000,
    minAge: 18,
    maxAge: 65,
  },
  {
    id: "life-whole",
    name: "Whole Life",
    category: "life",
    description: "Permanent life cover with cash value.",
    baseRate: 0.0035,
    minCoverage: 25000,
    maxCoverage: 1000000,
    minAge: 18,
    maxAge: 70,
  },
  {
    id: "health-basic",
    name: "Health Essential",
    category: "health",
    description: "Hospitalization and day-care cover.",
    baseRate: 0.0021,
    minCoverage: 100000,
    maxCoverage: 1000000,
    minAge: 18,
    maxAge: 75,
  },
  {
    id: "auto-comprehensive",
    name: "Auto Comprehensive",
    category: "auto",
    description: "Own-damage plus third-party motor cover.",
    baseRate: 0.0045,
    minCoverage: 5000,
    maxCoverage: 150000,
    minAge: 18,
    maxAge: 80,
  },
  {
    id: "home-shield",
    name: "Home Shield",
    category: "home",
    description: "Building and contents protection.",
    baseRate: 0.0008,
    minCoverage: 50000,
    maxCoverage: 3000000,
    minAge: 18,
    maxAge: 99,
  },
  {
    id: "travel-secure",
    name: "Travel Secure",
    category: "health",
    description: "Travel Secure insurance product.",
    baseRate: 0.0018,
    minCoverage: 25000,
    maxCoverage: 500000,
    minAge: 18,
    maxAge: 75,
  },
];

// The "default plan" the calculator loads with.
export const DEFAULT_PLAN = {
  productId: "life-term-20",
  coverage: 500000,
  age: 30,
  term: 20,
  smoker: false,
};

export function getProduct(productId) {
  return PRODUCTS.find((p) => p.id === productId);
}

/**
 * Search the product catalog by free-text keyword and/or category.
 * Mirrors the behaviour the MCP server exposes as `search_insurance_products`.
 */
export function searchProducts({ query = "", category = "" } = {}) {
  const q = String(query).trim().toLowerCase();
  const cat = String(category).trim().toLowerCase();
  return PRODUCTS.filter((p) => {
    const matchesCategory = !cat || cat === "all" || p.category === cat;
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

function riskMultiplier(age, smoker) {
  let m = 1;
  if (age >= 60) m *= 1.8;
  else if (age >= 45) m *= 1.4;
  else if (age >= 30) m *= 1.1;
  if (smoker) m *= 1.5;
  return m;
}

/**
 * Calculate a premium quote. Returns { ok: true, ... } or { ok: false, error }.
 */
export function calculatePremium({
  productId,
  coverage,
  age,
  term = 1,
  smoker = false,
} = {}) {
  const product = getProduct(productId);
  if (!product) return { ok: false, error: `Unknown product: ${productId}` };

  coverage = Number(coverage);
  age = Number(age);
  term = Number(term) || 1;

  if (!Number.isFinite(coverage) || coverage <= 0) {
    return { ok: false, error: "Coverage must be a positive number." };
  }
  if (coverage < product.minCoverage || coverage > product.maxCoverage) {
    return {
      ok: false,
      error: `Coverage for ${product.name} must be between ${product.minCoverage} and ${product.maxCoverage}.`,
    };
  }
  if (!Number.isFinite(age) || age < product.minAge || age > product.maxAge) {
    return {
      ok: false,
      error: `Age for ${product.name} must be between ${product.minAge} and ${product.maxAge}.`,
    };
  }

  const multiplier = riskMultiplier(age, Boolean(smoker));
  const annualPremium = coverage * product.baseRate * multiplier;
  const monthlyPremium = annualPremium / 12;
  const totalForTerm = annualPremium * term;

  return {
    ok: true,
    productId: product.id,
    productName: product.name,
    coverage,
    age,
    term,
    smoker: Boolean(smoker),
    riskMultiplier: Number(multiplier.toFixed(2)),
    annualPremium: Number(annualPremium.toFixed(2)),
    monthlyPremium: Number(monthlyPremium.toFixed(2)),
    totalForTerm: Number(totalForTerm.toFixed(2)),
    currency: "INR",
  };
}
