import { z } from 'zod';
import { premiumSchema } from '@/lib/validation/premium-schema';
import type { PremiumInput } from '@/types/insurance';

export const TOOL_NAME = 'calculate_premium';
export const TOOL_DESCRIPTION = 'Calculate an illustrative Shriram health insurance premium using Shriram’s own pricing engine. Ask the user for missing required details; never invent ages, coverage, tenure or add-on choices. sum is in INR lakh, not rupees. For parents coverage, age is the proposer age and the proposer is not covered. Return the tool’s amounts and disclaimer faithfully; never substitute a guessed premium if the tool fails. This does not purchase insurance or establish eligibility.';
export const agentInputSchema = z.strictObject({
  coverage: z.enum(['self', 'couple', 'children', 'family', 'parents']).describe('People to insure. family includes proposer, spouse and children.'),
  age: z.number().int().min(18).max(100).describe('Proposer age in whole years.'),
  spouseAge: z.number().int().min(18).max(100).optional().describe('Required for couple and family.'),
  childAges: z.array(z.number().int().min(0).max(25)).max(4).optional().describe('One to four ages required for children and family.'),
  parentAges: z.array(z.number().int().min(18).max(100)).max(2).optional().describe('One or two ages required for parents.'),
  sum: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(15), z.literal(25), z.literal(50)]).describe('Sum insured in lakh INR.'),
  tenure: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe('Policy years.'),
  checkups: z.boolean().describe('Whether to include the annual checkups add-on.'),
  room: z.boolean().describe('Whether to include room-rent flexibility.'),
});
export type AgentInput = z.infer<typeof agentInputSchema>;
export const toolInputJsonSchema = z.toJSONSchema(agentInputSchema);

export function toAgentInput(v: PremiumInput): AgentInput {
  return { coverage: v.coverage, age: v.age, sum: v.sum, tenure: v.tenure, checkups: v.checkups, room: v.room,
    ...(['couple', 'family'].includes(v.coverage) ? { spouseAge: v.spouseAge } : {}),
    ...(['children', 'family'].includes(v.coverage) ? { childAges: v.childAges } : {}),
    ...(v.coverage === 'parents' ? { parentAges: v.parentAges } : {}) };
}
export function normalizeInput(input: unknown) {
  const v = agentInputSchema.parse(input);
  const normalized = premiumSchema.parse({ ...v, spouseAge: v.spouseAge ?? 0, childAges: v.childAges ?? [], parentAges: v.parentAges ?? [] });
  const unexpected = [
    !['couple', 'family'].includes(v.coverage) && v.spouseAge !== undefined && 'spouseAge',
    !['children', 'family'].includes(v.coverage) && v.childAges !== undefined && 'childAges',
    v.coverage !== 'parents' && v.parentAges !== undefined && 'parentAges',
  ].filter(Boolean) as string[];
  if (unexpected.length) throw new z.ZodError(unexpected.map(key => ({ code: 'custom', path: [key], message: 'This member is not included in the selected coverage. Remove the field or change coverage.' })));
  return normalized;
}
