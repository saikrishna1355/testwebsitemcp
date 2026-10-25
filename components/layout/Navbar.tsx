'use client';
import { useState } from 'react';
import { ArrowUpRight, HeartPulse, Menu, X } from 'lucide-react';
export function Brand() { return <a href="#" className="brand" aria-label="Shriram home"><span><HeartPulse size={24} /></span>Shriram<span className="brand-dot">.</span></a>; }
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  return <><header className="nav"><div className="container nav-inner"><Brand /><nav aria-label="Main navigation" className={open ? 'nav-links open' : 'nav-links'}>{[['Health Plans', 'plans'], ['Coverage', 'coverage'], ['Benefits', 'benefits'], ['FAQs', 'faqs']].map(([label,id]) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}</nav><div className="nav-actions"><button className="text-button sign-in" onClick={() => setNotice(true)}>Sign In</button><a className="button small" href="#calculator">Get Your Quote <ArrowUpRight size={16}/></a><button className="menu-button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div></div></header>{notice && <div className="notice" role="status">This is a product preview. Accounts are not available yet.<button onClick={() => setNotice(false)} aria-label="Dismiss notification"><X size={18}/></button></div>}</>;
}
