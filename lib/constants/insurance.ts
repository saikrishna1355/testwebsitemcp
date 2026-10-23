export const coverageOptions = [
  { value: 'self', label: 'Just myself', detail: 'A little care for you' },
  { value: 'couple', label: 'Self + Spouse', detail: 'Better, together' },
  { value: 'children', label: 'Self + Children', detail: 'You and your little ones' },
  { value: 'family', label: 'My family', detail: 'One plan, your people' },
  { value: 'parents', label: 'My parents', detail: 'Care for those who cared' },
] as const;
export const sums = [3, 5, 10, 15, 25, 50] as const;
export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
