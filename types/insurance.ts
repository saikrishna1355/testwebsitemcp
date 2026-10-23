import type { z } from 'zod';
import type { premiumSchema } from '@/lib/validation/premium-schema';
export type PremiumInput = z.infer<typeof premiumSchema>;
export type PremiumEstimate = { base: number; members: number; addons: number; tax: number; annual: number; monthly: number; total: number };
