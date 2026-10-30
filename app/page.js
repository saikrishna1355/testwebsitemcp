"use client";

import { useCallback, useEffect, useState } from "react";
import { PRODUCTS, DEFAULT_PLAN, calculatePremium } from "@/lib/insurance";
import WebMcp from "./WebMcp";

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function Home() {
  const [form, setForm] = useState(DEFAULT_PLAN);
  const [quote, setQuote] = useState(() => calculatePremium(DEFAULT_PLAN));

  // Recalculate the premium in real time whenever any input changes
  // (plan, coverage, age, term or smoker).
  useEffect(() => {
    setQuote(calculatePremium(form));
  }, [form]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function onCalculate(e) {
    e?.preventDefault();
    setQuote(calculatePremium(form));
  }

  function onReset() {
    setForm(DEFAULT_PLAN);
  }

  // Called by the WebMCP `calculate_premium` tool so an agent's calculation is
  // reflected back into the visible form (which recomputes the quote).
  const onAgentCalculate = useCallback((input) => {
    setForm((f) => ({
      ...f,
      ...(input.productId !== undefined && { productId: input.productId }),
      ...(input.coverage !== undefined && { coverage: Number(input.coverage) }),
      ...(input.age !== undefined && { age: Number(input.age) }),
      ...(input.term !== undefined && { term: Number(input.term) }),
      ...(input.smoker !== undefined && { smoker: Boolean(input.smoker) }),
    }));
  }, []);

  return (
    <>
      <WebMcp onCalculate={onAgentCalculate} />

      <header className="header">
        <h1>Shriram Website</h1>
        <p>Insurance Premium Calculator</p>
      </header>

      <main className="container">
        <section className="card">
          <h2>Calculate your premium</h2>

          <form onSubmit={onCalculate}>
            <div className="grid">
              <div className="field">
                <label htmlFor="productId">Plan</label>
                <select
                  id="productId"
                  value={form.productId}
                  onChange={(e) => update("productId", e.target.value)}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="coverage">Coverage (INR)</label>
                <input
                  id="coverage"
                  type="number"
                  min="0"
                  value={form.coverage}
                  onChange={(e) => update("coverage", Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={(e) => update("age", Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="term">Term (years)</label>
                <input
                  id="term"
                  type="number"
                  min="1"
                  value={form.term}
                  onChange={(e) => update("term", Number(e.target.value))}
                />
              </div>

              <div className="field checkbox-field">
                <input
                  id="smoker"
                  type="checkbox"
                  checked={form.smoker}
                  onChange={(e) => update("smoker", e.target.checked)}
                />
                <label htmlFor="smoker">Smoker</label>
              </div>
            </div>

            <div className="actions">
              <button type="submit">Calculate Premium</button>
              <button type="button" className="secondary" onClick={onReset}>
                Reset to default plan
              </button>
            </div>
          </form>

          <div className={`result${quote.ok ? "" : " error"}`}>
            {quote.ok ? (
              <>
                <strong>{quote.productName}</strong> — risk multiplier{" "}
                {quote.riskMultiplier}×
                <div className="quote-grid">
                  <div className="quote-item">
                    <div className="value">
                      {formatINR(quote.monthlyPremium)}
                    </div>
                    <div className="label">Monthly premium</div>
                  </div>
                  <div className="quote-item">
                    <div className="value">
                      {formatINR(quote.annualPremium)}
                    </div>
                    <div className="label">Annual premium</div>
                  </div>
                  <div className="quote-item">
                    <div className="value">{formatINR(quote.totalForTerm)}</div>
                    <div className="label">Total for {quote.term} yr term</div>
                  </div>
                  <div className="quote-item">
                    <div className="value">{formatINR(quote.coverage)}</div>
                    <div className="label">Coverage</div>
                  </div>
                </div>
              </>
            ) : (
              <p>⚠ {quote.error}</p>
            )}
          </div>

          <p className="hint">
            This site also exposes an HTTP API (<code>/api/products</code>,{" "}
            <code>/api/calculate-premium</code>) and ships an MCP server, so an
            agent such as Kiro can fetch exact premiums from this website
            instead of guessing.
          </p>
        </section>
      </main>
    </>
  );
}
