import { z } from 'zod';
const adult = z.number().int('Enter a whole age.').min(18, 'Age must be at least 18.').max(100, 'Enter an age up to 100.');
export const premiumSchema = z.object({
  coverage: z.enum(['self', 'couple', 'children', 'family', 'parents']),
  age: adult,
  spouseAge: z.union([z.number(), z.nan()]),
  childAges: z.array(z.union([z.number(), z.nan()])),
  parentAges: z.array(z.union([z.number(), z.nan()])),
  sum: z.union([z.literal(3), z.literal(5), z.literal(10), z.literal(15), z.literal(25), z.literal(50)]),
  tenure: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  checkups: z.boolean(),
  room: z.boolean(),
}).superRefine((v, ctx) => {
  if (['couple', 'family'].includes(v.coverage) && !adult.safeParse(v.spouseAge).success) ctx.addIssue({ code: 'custom', path: ['spouseAge'], message: 'Spouse age must be a whole number from 18 to 100.' });
  const list = v.coverage === 'parents' ? v.parentAges : ['children', 'family'].includes(v.coverage) ? v.childAges : [];
  const key = v.coverage === 'parents' ? 'parentAges' : 'childAges';
  if ((v.coverage === 'parents' || ['children', 'family'].includes(v.coverage)) && (list.length < 1 || list.length > (key === 'parentAges' ? 2 : 4))) ctx.addIssue({ code: 'custom', path: [key], message: 'Select a valid number of members.' });
  list.forEach((age, i) => { if (!Number.isInteger(age) || age < (key === 'parentAges' ? 18 : 0) || age > (key === 'parentAges' ? 100 : 25)) ctx.addIssue({ code: 'custom', path: [key, i], message: key === 'parentAges' ? 'Enter a whole age from 18 to 100.' : 'Enter a whole age from 0 to 25.' }); });
});
