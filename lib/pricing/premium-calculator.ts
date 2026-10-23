import { premiumSchema } from '@/lib/validation/premium-schema';
import type { PremiumInput, PremiumEstimate } from '@/types/insurance';
// Demonstration values only. These are not rates from an insurer.
export const MOCK_PRICING = { base: 3200, child: 950, checkups: 600, room: 850, taxRate: 0, ageBands: [{ max: 35, factor: 1 }, { max: 50, factor: 1.45 }, { max: 65, factor: 2.2 }, { max: 100, factor: 3.4 }] };
export function calculatePremium(input: PremiumInput): PremiumEstimate {
  const v = premiumSchema.parse(input);
  const multiplier = Math.sqrt(v.sum / 3);
  const adultCost = (age: number) => Math.round(MOCK_PRICING.base * MOCK_PRICING.ageBands.find(b => age <= b.max)!.factor * multiplier);
  const base = adultCost(v.coverage === 'parents' ? v.parentAges[0] : v.age);
  let members = 0;
  if (['couple', 'family'].includes(v.coverage)) members += adultCost(v.spouseAge);
  if (['children', 'family'].includes(v.coverage)) members += Math.round(v.childAges.length * MOCK_PRICING.child * multiplier);
  if (v.coverage === 'parents' && v.parentAges.length > 1) members += adultCost(v.parentAges[1]);
  const addons = (v.checkups ? MOCK_PRICING.checkups : 0) + (v.room ? MOCK_PRICING.room : 0);
  const tax = Math.round((base + members + addons) * MOCK_PRICING.taxRate);
  const annual = base + members + addons + tax;
  return { base, members, addons, tax, annual, monthly: Math.round(annual / 12), total: annual * v.tenure };
}
