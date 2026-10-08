import React, { useEffect, useMemo, useState } from 'react';
import { FinancialPlan, SavingsGoal, SipInvestment } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { PlusIcon, TrashIcon, TargetIcon, ArrowTrendingUpIcon } from './icons';

interface FinancialPlanPageProps {
  plan: FinancialPlan | null;
  goals: SavingsGoal[];
  onSave: (plan: FinancialPlan) => void;
  onManageGoals: () => void;
}

const emptyPlan: FinancialPlan = {
  currentAge: null,
  retirementAge: null,
  retirementSavings: 0,
  desiredMonthlyRetirementIncome: 0,
  sipInvestments: [],
};

const futureValue = (principal: number, monthlyContribution: number, annualReturn: number, years: number) => {
  const months = Math.max(0, Math.round(years * 12));
  const monthlyRate = annualReturn / 100 / 12;
  if (!months) return principal;
  if (monthlyRate === 0) return principal + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * growth + monthlyContribution * ((growth - 1) / monthlyRate);
};

const FinancialPlanPage: React.FC<FinancialPlanPageProps> = ({ plan, goals, onSave, onManageGoals }) => {
  const { formatCurrency } = useSettings();
  const [draft, setDraft] = useState<FinancialPlan>(() => plan ?? emptyPlan);
  const [saved, setSaved] = useState(true);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  useEffect(() => {
    setDraft(plan ?? emptyPlan);
    setSaved(true);
  }, [plan]);
  const updatePlan = (changes: Partial<FinancialPlan>) => {
    setDraft(current => ({ ...current, ...changes }));
    setSaved(false);
    setValidationMessage(null);
  };

  const monthlyInvesting = draft.sipInvestments.reduce((total, investment) => total + Math.max(0, investment.monthlyAmount), 0);
  const weightedReturn = monthlyInvesting > 0
    ? draft.sipInvestments.reduce((total, investment) => total + Math.max(0, investment.monthlyAmount) * Math.min(30, Math.max(0, investment.expectedAnnualReturn)), 0) / monthlyInvesting
    : 0;
  const yearsToRetirement = draft.currentAge !== null && draft.retirementAge !== null
    ? Math.max(0, draft.retirementAge - draft.currentAge)
    : 0;
  const projectedCorpus = useMemo(
    () => futureValue(draft.retirementSavings, monthlyInvesting, weightedReturn, yearsToRetirement),
    [draft.retirementSavings, monthlyInvesting, weightedReturn, yearsToRetirement],
  );
  const estimatedTarget = draft.desiredMonthlyRetirementIncome > 0
    ? draft.desiredMonthlyRetirementIncome * 12 * 25 * Math.pow(1.03, yearsToRetirement)
    : 0;
  const targetProgress = estimatedTarget > 0 ? Math.min(100, projectedCorpus / estimatedTarget * 100) : 0;

  const updateInvestment = (id: string, changes: Partial<SipInvestment>) => {
    updatePlan({ sipInvestments: draft.sipInvestments.map(item => item.id === id ? { ...item, ...changes } : item) });
  };

  const addInvestment = () => {
    updatePlan({
      sipInvestments: [...draft.sipInvestments, {
        id: crypto.randomUUID(),
        name: '',
        monthlyAmount: 0,
        expectedAnnualReturn: 7,
      }],
    });
  };

  const handleSave = () => {
    if (draft.currentAge !== null && (draft.currentAge < 18 || draft.currentAge > 100)) {
      setValidationMessage('Enter an age between 18 and 100.');
      return;
    }
    if (draft.retirementAge !== null && (draft.retirementAge > 100 || (draft.currentAge !== null && draft.retirementAge <= draft.currentAge))) {
      setValidationMessage('Retirement age must be above your current age and no more than 100.');
      return;
    }
    const cleanPlan = {
      ...draft,
      sipInvestments: draft.sipInvestments.filter(item => item.name.trim()).map(item => ({ ...item, name: item.name.trim() })),
    };
    onSave(cleanPlan);
    setDraft(cleanPlan);
    setSaved(true);
  };

  const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10';
  const cardClass = 'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6';

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Your money, on your terms</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Build your financial plan</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">Set the future you’re working toward. Add retirement assumptions and the monthly investments you already make; Aureus will show an illustration, not a promise.</p>
          </div>
          <button onClick={handleSave} className="shrink-0 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200/30">
            {saved ? 'Plan saved' : 'Save my plan'}
          </button>
        </div>
        {validationMessage && <p className="relative mt-4 text-sm font-semibold text-rose-200" role="alert">{validationMessage}</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className={cardClass}>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><ArrowTrendingUpIcon className="h-5 w-5" /></div>
              <div><h2 className="text-lg font-bold text-slate-900">Retirement picture</h2><p className="mt-1 text-sm text-slate-500">Use your own estimates. You can update them any time.</p></div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-600">Your age<input className={fieldClass} type="number" min="18" max="100" placeholder="e.g. 32" value={draft.currentAge ?? ''} onChange={event => updatePlan({ currentAge: event.target.value ? Number(event.target.value) : null })} /></label>
              <label className="text-xs font-semibold text-slate-600">Age you’d like to retire<input className={fieldClass} type="number" min="18" max="100" placeholder="e.g. 60" value={draft.retirementAge ?? ''} onChange={event => updatePlan({ retirementAge: event.target.value ? Number(event.target.value) : null })} /></label>
              <label className="text-xs font-semibold text-slate-600">Retirement savings today<input className={fieldClass} type="number" min="0" step="1000" placeholder="0" value={draft.retirementSavings || ''} onChange={event => updatePlan({ retirementSavings: Math.max(0, Number(event.target.value) || 0) })} /></label>
              <label className="text-xs font-semibold text-slate-600">Monthly income you want in retirement<input className={fieldClass} type="number" min="0" step="1000" placeholder="In today’s money" value={draft.desiredMonthlyRetirementIncome || ''} onChange={event => updatePlan({ desiredMonthlyRetirementIncome: Math.max(0, Number(event.target.value) || 0) })} /></label>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-slate-900">Monthly investments</h2><p className="mt-1 text-sm text-slate-500">Add SIPs or other regular contributions you want included.</p></div>
              <button onClick={addInvestment} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50"><PlusIcon className="h-4 w-4" />Add investment</button>
            </div>
            {draft.sipInvestments.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-7 text-center">
                <p className="text-sm font-semibold text-slate-700">No monthly investments added</p><p className="mt-1 text-xs text-slate-500">You can add mutual fund SIPs, recurring stock purchases, or leave this blank.</p>
                <button onClick={addInvestment} className="mt-3 text-xs font-bold text-amber-700 hover:text-amber-800">Add your first investment</button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {draft.sipInvestments.map((investment, index) => (
                  <div key={investment.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
                    <label className="text-[11px] font-semibold text-slate-500">Fund or investment name<input className={fieldClass} placeholder={`Investment ${index + 1}`} value={investment.name} onChange={event => updateInvestment(investment.id, { name: event.target.value })} /></label>
                    <label className="text-[11px] font-semibold text-slate-500">Monthly amount<input className={fieldClass} type="number" min="0" step="500" value={investment.monthlyAmount || ''} onChange={event => updateInvestment(investment.id, { monthlyAmount: Math.max(0, Number(event.target.value) || 0) })} /></label>
                    <label className="text-[11px] font-semibold text-slate-500">Return assumption (%/yr)<input className={fieldClass} type="number" min="0" max="30" step="0.5" value={investment.expectedAnnualReturn} onChange={event => updateInvestment(investment.id, { expectedAnnualReturn: Math.min(30, Math.max(0, Number(event.target.value) || 0)) })} /></label>
                    <button aria-label={`Remove ${investment.name || `investment ${index + 1}`}`} onClick={() => updatePlan({ sipInvestments: draft.sipInvestments.filter(item => item.id !== investment.id) })} className="mb-0.5 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><TrashIcon className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-[11px] leading-5 text-slate-500">Returns are your assumptions, not forecasts. Aureus does not connect to a broker, track live prices, or recommend securities.</p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Illustrative retirement projection</p>
            {draft.currentAge === null || draft.retirementAge === null ? (
              <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm leading-6 text-slate-600">Add your current age and target retirement age to see a projection based on your monthly investments.</div>
            ) : (
              <>
                <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">{formatCurrency(projectedCorpus)}</p>
                <p className="mt-1 text-xs text-slate-600">Estimated in {yearsToRetirement} years, using a {weightedReturn.toFixed(1)}% weighted annual return assumption.</p>
                {estimatedTarget > 0 && <div className="mt-5"><div className="mb-2 flex justify-between text-xs font-semibold text-slate-600"><span>Illustrative target</span><span>{targetProgress.toFixed(0)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-amber-100"><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${targetProgress}%` }} /></div><p className="mt-2 text-xs text-slate-500">Target: {formatCurrency(estimatedTarget)}</p></div>}
              </>
            )}
            <div className="mt-5 border-t border-amber-200/70 pt-4 text-[11px] leading-5 text-slate-600">Illustration assumes monthly contributions, steady returns, and 3% annual inflation. The target uses 25× estimated annual income as a rough planning heuristic. Actual returns, taxes, and inflation vary; this is not financial advice.</div>
          </section>

          <section className={cardClass}>
            <div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><TargetIcon className="h-5 w-5" /></div><div><h2 className="text-lg font-bold text-slate-900">Your financial goals</h2><p className="mt-1 text-sm text-slate-500">Name what you’re saving for and when you need it.</p></div></div></div>
            {goals.length ? <div className="mt-4 space-y-3">{goals.map(goal => <div key={goal.id}><div className="flex justify-between gap-3 text-xs"><span className="truncate font-semibold text-slate-700">{goal.name}</span><span className="shrink-0 text-slate-500">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(0, goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount * 100 : 0))}%` }} /></div></div>)}</div> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No goals yet. Add a home deposit, emergency fund, education, travel, or any goal that matters to you.</p>}
            <button onClick={onManageGoals} className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50">{goals.length ? 'Manage my goals' : 'Add my first goal'}</button>
          </section>

          <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
            <p className="text-sm font-bold">Monthly investing plan</p><p className="mt-1 text-xs text-slate-300">Across {draft.sipInvestments.length} investments</p><p className="mt-3 text-2xl font-bold">{formatCurrency(monthlyInvesting)}<span className="ml-1 text-xs font-medium text-slate-400">/ month</span></p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default FinancialPlanPage;
