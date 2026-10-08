import React, { useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ChartPieIcon, ChartBarIcon, ArrowPathIcon, GreekPillarIcon, TrashIcon, CreditCardIcon, SparklesIcon, SearchIcon, DocumentArrowDownIcon, TargetIcon } from './icons';
import AlertsWidget from './AlertsWidget';
import { Alert } from '../types';
import { useLenis } from '../hooks/useLenis';

interface HeaderProps {
  currentView: 'landing' | 'dashboard' | 'reports' | 'ai' | 'plan';
  onChangeView: (view: 'landing' | 'dashboard' | 'reports' | 'ai' | 'plan') => void;
  onManageBudgets: () => void;
  onManageDebts?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenStatementUpload?: () => void;
  onOpenGoals?: () => void;
  alerts: Alert[];
  onDismissAlert: (id: string) => void;
  onSnoozeAlert: (id: string, days: number) => void;
  onLoadDemoData?: (currency: string) => void;
  onResetData?: () => void;
  budgetCount?: number;
  debtCount?: number;
}

const navigationItems = [
  { view: 'plan', label: 'Plan', icon: TargetIcon },
  { view: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
  { view: 'ai', label: 'Insights', icon: SparklesIcon },
  { view: 'reports', label: 'Reports', icon: ChartPieIcon },
] as const;

const Header: React.FC<HeaderProps> = ({
  currentView,
  onChangeView,
  onManageBudgets,
  onManageDebts,
  onOpenCommandPalette,
  onOpenStatementUpload,
  onOpenGoals,
  alerts,
  onDismissAlert,
  onSnoozeAlert,
  onLoadDemoData,
  onResetData,
  budgetCount,
  debtCount,
}) => {
  const { currency, setCurrency } = useSettings();
  const { progress } = useLenis();
  const toolsMenuRef = useRef<HTMLDetailsElement>(null);

  const handleLoadDemoData = () => {
    if (confirm('This replaces the financial data currently stored in this browser with a demo scenario in ' + currency + '. Continue?')) {
      onLoadDemoData?.(currency);
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to remove all local financial data? This cannot be undone.')) {
      onResetData?.();
    }
  };

  const runToolAction = (action?: () => void) => {
    action?.();
    if (toolsMenuRef.current) toolsMenuRef.current.open = false;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onChangeView('landing')}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Go to Aureus home"
            aria-label="Go to Aureus home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 transition-transform duration-200 group-hover:-rotate-3">
              <GreekPillarIcon className="h-[18px] w-[18px] text-amber-300" />
            </span>
            <span>
              <span className="block font-serif text-base font-black tracking-[0.12em] text-slate-950">AUREUS</span>
              <span className="hidden text-[9px] font-medium tracking-wide text-slate-500 sm:block">Money, in perspective</span>
            </span>
          </button>

          <nav className="flex min-w-0 items-center gap-0.5" aria-label="Main navigation">
            {navigationItems.map(({ view, label, icon: Icon }) => {
              const isCurrentView = currentView === view;
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => onChangeView(view)}
                  aria-current={isCurrentView ? 'page' : undefined}
                  aria-label={label}
                  className={'relative flex h-10 items-center gap-2 rounded-lg px-2.5 text-xs font-semibold transition-colors sm:px-3 lg:px-3.5 ' + (
                    isCurrentView ? 'bg-slate-50 text-slate-950' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon className={'h-4 w-4 shrink-0 ' + (isCurrentView ? 'text-amber-700' : 'text-slate-400')} />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950 sm:px-3"
                title="Search commands (Ctrl+K or ⌘K)"
                aria-label="Open command palette"
              >
                <SearchIcon className="h-4 w-4" />
                <span className="hidden text-xs font-semibold lg:inline">Search</span>
                <kbd className="hidden rounded border border-slate-200 px-1 text-[9px] text-slate-400 xl:inline">⌘K</kbd>
              </button>
            )}

            <AlertsWidget alerts={alerts} onDismiss={onDismissAlert} onSnooze={onSnoozeAlert} />

            <details ref={toolsMenuRef} className="relative">
              <summary className="flex h-10 cursor-pointer list-none items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-3">
                More
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-slate-400" fill="none" aria-hidden="true">
                  <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <div className="app-tools-menu absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,.14)]">
                <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
                {onOpenStatementUpload && (
                  <button type="button" aria-label="Import statement" onClick={() => runToolAction(onOpenStatementUpload)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <DocumentArrowDownIcon className="h-4 w-4 text-slate-400" /> Import statement
                  </button>
                )}
                {onOpenGoals && (
                  <button type="button" aria-label="Manage goals" onClick={() => runToolAction(onOpenGoals)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <TargetIcon className="h-4 w-4 text-slate-400" /> Manage goals
                  </button>
                )}
                <button type="button" aria-label="Manage budgets" onClick={() => runToolAction(onManageBudgets)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  <span className="flex items-center gap-2.5"><ChartPieIcon className="h-4 w-4 text-slate-400" /> Budgets</span>
                  {budgetCount ? <span className="text-[10px] text-slate-400">{budgetCount}</span> : null}
                </button>
                {onManageDebts && (
                  <button type="button" aria-label="Manage debts" onClick={() => runToolAction(onManageDebts)} className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50">
                    <span className="flex items-center gap-2.5"><CreditCardIcon className="h-4 w-4 text-slate-400" /> Debts</span>
                    {debtCount ? <span className="text-[10px] text-slate-400">{debtCount}</span> : null}
                  </button>
                )}

                <div className="my-2 border-t border-slate-100" />
                <label className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600">
                  Currency
                  <select
                    value={currency}
                    onChange={event => setCurrency(event.target.value as 'USD' | 'EUR' | 'GBP' | 'INR')}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-amber-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </label>

                <div className="my-2 border-t border-slate-100" />
                <button type="button" aria-label="Load demo data" onClick={() => runToolAction(handleLoadDemoData)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  <ArrowPathIcon className="h-4 w-4 text-slate-400" /> Load demo data
                </button>
                <button type="button" aria-label="Reset local data" onClick={() => runToolAction(handleResetData)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700">
                  <TrashIcon className="h-4 w-4" /> Reset local data
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
      <div className="h-px bg-slate-100">
        <div className="h-px bg-amber-500/80 transition-[width] duration-100" style={{ width: String(Math.round(progress * 100)) + '%' }} />
      </div>
    </header>
  );
};

export default Header;
