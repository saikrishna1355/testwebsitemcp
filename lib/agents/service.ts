import { z } from 'zod';
import { calculatePremium } from '@/lib/pricing/premium-calculator';
import { normalizeInput, toAgentInput } from './contract';

export const PRICING_VERSION = 'Shriram-mock-v1';
export function createEstimate(input: unknown) {
  const normalized = normalizeInput(input);
  return {
    status: 'success' as const,
    estimateId: crypto.randomUUID(),
    calculatedAt: new Date().toISOString(),
    pricingVersion: PRICING_VERSION,
    source: 'Shriram premium calculator',
    sourceUrl: process.env.SITE_URL || 'https://testwebsitemcp.vercel.app/',
    currency: 'INR' as const,
    illustrative: true as const,
    inputs: toAgentInput(normalized),
    estimate: calculatePremium(normalized),
    disclaimer: 'Illustrative mock estimate, not an insurer quote or eligibility decision. Confirm actual premium, coverage, exclusions and taxes with an insurer. Monthly equivalent is not an instalment offer. No tax or tenure discount is included in this mock model.',
  };
}
export type EstimateResponse = ReturnType<typeof createEstimate>;
export function validationFailure(error: unknown) {
  if (!(error instanceof z.ZodError)) throw error;
  return { status: 'error' as const, code: 'INVALID_INPUT', message: 'Ask the user to supply or correct these details. No premium was calculated.', issues: error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })) };
}
