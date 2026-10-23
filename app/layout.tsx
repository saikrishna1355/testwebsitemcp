import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Aarogya — Health insurance that puts you first', description: 'Explore individual, family and parents’ health coverage with a simple illustrative premium calculator. A transparent insurance concept for India.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en-IN"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>; }
