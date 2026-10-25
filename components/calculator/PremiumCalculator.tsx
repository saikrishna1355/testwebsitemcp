'use client';
import { useEffect, useState } from 'react';
import { useForm, useWatch, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Check, UserRound, UsersRound, Heart, Baby, ShieldCheck, Info } from 'lucide-react';
import { premiumSchema } from '@/lib/validation/premium-schema';
import { coverageOptions, sums, money } from '@/lib/constants/insurance';
import { toAgentInput } from '@/lib/agents/contract';
import { requestEstimate } from '@/lib/agents/client';
import { registerPremiumTool, type ModelContext } from '@/lib/agents/webmcp';
import type { EstimateResponse } from '@/lib/agents/service';
import type { PremiumInput, PremiumEstimate } from '@/types/insurance';
const icons = [UserRound, Heart, Baby, UsersRound, Heart];
export default function PremiumCalculator() {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<PremiumEstimate | null>(null);
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [receipt, setReceipt] = useState<EstimateResponse | null>(null);
  const [started, setStarted] = useState(false);
  const { register, control, reset, setValue, trigger, handleSubmit, formState: { errors } } = useForm<PremiumInput>({ resolver: zodResolver(premiumSchema), defaultValues: { coverage: 'self', age: 28, spouseAge: 28, childAges: [5], parentAges: [60, 58], sum: 10, tenure: 1, checkups: false, room: false } });
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext ?? (navigator as Navigator & { modelContext?: ModelContext }).modelContext;
    if (!context) return;
    try {
      return registerPremiumTool(context, data => {
        reset({ ...data.inputs, spouseAge: data.inputs.spouseAge ?? 28, childAges: data.inputs.childAges ?? [5], parentAges: data.inputs.parentAges ?? [60] });
        setResult(data.estimate); setReceipt(data); setRequestError(''); setStarted(false); setStep(3);
        document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
      }, setRequestError);
    } catch { return; }
  }, [reset]);
  const submitEstimate = async (v: PremiumInput) => {
    setBusy(true); setRequestError(''); setResult(null); setReceipt(null);
    try {
      const data = await requestEstimate(toAgentInput(v));
      setResult(data.estimate); setReceipt(data); setStarted(false); move(3);
    } catch (error) { setRequestError(error instanceof Error ? error.message : 'Calculation failed. Please try again.'); }
    finally { setBusy(false); }
  };
  const values = useWatch({ control }) as PremiumInput;
  const move = (n: number) => { setStep(n); requestAnimationFrame(() => document.getElementById('calculator-heading')?.focus()); };
  const next = async () => { const fields: FieldPath<PremiumInput>[] = step === 0 ? ['coverage'] : ['age', 'spouseAge', 'childAges', 'parentAges']; if (await trigger(fields)) move(step + 1); };
  const ageField = (name: FieldPath<PremiumInput>, label: string, error?: string, child = false) => <label className="field" key={name}>{label}<div className="input-unit"><input type="number" min={child ? 0 : 18} max={child ? 25 : 100} step="1" {...register(name, { valueAsNumber: true })} aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined}/><span>years</span></div>{error && <span className="error" id={`${name}-error`}>{error}</span>}</label>;
  return <section id="calculator" className="calculator-section container"><div className="section-heading"><div><span className="eyebrow">A HEALTHIER FUTURE STARTS HERE</span><h2>Your people. Your plan.</h2></div><p>A few simple details.<br/>A clearer picture of your premium.</p></div><div className="calculator-shell"><aside className="calculator-sidebar"><span className="sidebar-icon"><ShieldCheck size={28}/></span><h3>Peace of mind,<br/>personalised.</h3><p>Let’s find a starting point for the care you need.</p><ol className="steps">{['Who’s covered', 'Your details', 'Your coverage', 'Your estimate'].map((label, i) => <li key={label} className={step === i ? 'active' : step > i ? 'complete' : ''} aria-current={step === i ? 'step' : undefined}><span>{step > i ? <Check size={15}/> : `0${i + 1}`}</span>{label}</li>)}</ol><div className="private-note"><ShieldCheck size={16}/><span>No phone number. No spam.<br/>Just an estimate.</span></div></aside><div className="calculator-body"><div className="step-meta"><span>STEP {step + 1} OF 4</span><span>Made simple, for you</span></div><h3 id="calculator-heading" tabIndex={-1}>{['Who would you like to cover?', 'A little about your people.', 'Make your cover feel right.', 'Your starting point for peace of mind.'][step]}</h3><p className="muted">{['Choose the people you want to include in your plan.', 'Ages help us personalise your illustrative estimate.', 'Choose an amount, tenure and any optional extras.', 'A transparent estimate, with every cost in view.'][step]}</p><form aria-busy={busy} onSubmit={handleSubmit(submitEstimate)}>
    {step === 0 && <fieldset className="coverage-choices"><legend className="sr-only">Who to cover</legend>{coverageOptions.map((option, i) => { const Icon = icons[i]; return <label key={option.value} className={`coverage-choice ${values.coverage === option.value ? 'selected' : ''}`}><input type="radio" value={option.value} {...register('coverage')}/><Icon size={25}/><strong>{option.label}</strong><span>{option.detail}</span><span className="radio-dot">{values.coverage === option.value && <Check size={11}/>}</span></label>; })}</fieldset>}
    {step === 1 && <div className="details-fields">{ageField('age', values.coverage === 'parents' ? 'Your age (proposer, not covered)' : 'Your age', errors.age?.message)}{['couple','family'].includes(values.coverage) && ageField('spouseAge', 'Spouse’s age', errors.spouseAge?.message)}{(['children','family'].includes(values.coverage) || values.coverage === 'parents') && (() => { const key = values.coverage === 'parents' ? 'parentAges' : 'childAges'; const parents = key === 'parentAges'; return <><label className="field">Number of {parents ? 'parents' : 'children'}<select value={values[key].length} onChange={e => setValue(key, Array.from({length: Number(e.target.value)}, (_, i) => values[key][i] ?? (parents ? 60 : 5)))}>{Array.from({length: parents ? 2 : 4}, (_,i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label>{values[key].map((_,i) => ageField(`${key}.${i}`, `${parents ? 'Parent' : 'Child'} ${i+1} age`, errors[key]?.[i]?.message, !parents))}</>; })()}</div>}
    {step === 2 && <div className="cover-fields"><fieldset disabled={busy}><legend>Sum insured <span className="muted"> / total coverage</span></legend><div className="pills">{sums.map(sum => <label key={sum} className={values.sum === sum ? 'pill selected' : 'pill'}><input type="radio" name="sum" value={sum} checked={values.sum === sum} onChange={() => setValue('sum',sum)}/>₹{sum} lakh</label>)}</div></fieldset><fieldset><legend>Policy tenure</legend><div className="pills">{([1,2,3] as const).map(n => <label className={values.tenure === n ? 'pill selected' : 'pill'} key={n}><input type="radio" name="tenure" checked={values.tenure === n} onChange={() => setValue('tenure',n)}/>{n} {n === 1 ? 'year' : 'years'}</label>)}</div></fieldset><fieldset><legend>A little extra care <span className="muted"> / optional</span></legend><label className="addon"><input type="checkbox" {...register('checkups')}/><span><strong>Annual health checkups</strong><small>Illustrative wellness add-on · ₹600/year</small></span></label><label className="addon"><input type="checkbox" {...register('room')}/><span><strong>Room-rent flexibility</strong><small>Illustrative room add-on · ₹850/year</small></span></label></fieldset></div>}
    {step === 3 && result && <div className="result" aria-live="polite"><div className="result-hero"><span>ILLUSTRATIVE ANNUAL PREMIUM</span><div>{money(result.annual)}<small>/ year</small></div><p>{money(result.monthly)}/month equivalent · not an instalment offer</p></div><p className="result-selection">{coverageOptions.find(c => c.value === values.coverage)?.label} · ₹{values.sum} lakh cover · {values.tenure}-year tenure</p><dl>{[['Base premium',result.base],['Additional members',result.members],['Add-ons',result.addons],['Tax in this mock model (0%)',result.tax],['Full tenure total',result.total]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{money(Number(value))}</dd></div>)}</dl>{started && <div className="start-note" role="status"><strong>Your estimate is ready to review.</strong><p>Save or print this estimate, then discuss coverage, exclusions and eligibility with an insurer. Purchasing is not available in this preview.</p><button type="button" className="text-button" onClick={() => window.print()}>Print estimate ↗</button></div>}</div>}
    {requestError && <p className="error" role="alert">{requestError}</p>}
    {step === 3 && receipt && <p className="calculator-disclaimer">Calculated by Shriram / {receipt.pricingVersion} / Reference {receipt.estimateId}</p>}
    <div className="calculator-actions">{step > 0 ? <button className="text-button" type="button" disabled={busy} onClick={() => move(step === 3 ? 1 : step-1)}><ArrowLeft size={16}/>{step === 3 ? 'Modify Details' : 'Back'}</button> : <span className="time-note">About 2 minutes. All about you.</span>}{step < 2 ? <button type="button" className="button" onClick={next}>Continue <ArrowRight size={17}/></button> : step === 2 ? <button className="button" type="submit" disabled={busy}>{busy ? 'Calculating...' : 'See My Estimate'} <ArrowRight size={17}/></button> : <button className="button" type="button" onClick={() => setStarted(true)}>Get Started <ArrowRight size={17}/></button>}</div></form><p className="calculator-disclaimer"><Info size={14}/>Illustrative estimates only. Actual premiums and eligibility are confirmed by an insurer.</p></div></div></section>;
}

