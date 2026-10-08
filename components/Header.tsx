import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ChartPieIcon, ChartBarIcon, ArrowPathIcon, GreekPillarIcon, TrashIcon, CreditCardIcon, SparklesIcon, SearchIcon, DocumentArrowDownIcon, TargetIcon } from './icons';
import AlertsWidget from './AlertsWidget';
import { Alert } from '../types';
import { useLenis } from '../hooks/useLenis';

interface HeaderProps {
  currentView: 'dashboard' | 'reports' | 'ai' | 'plan';
  onChangeView: (view: 'dashboard' | 'reports' | 'ai' | 'plan') => void;
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
  debtCount
}) => {
  const { currency, setCurrency } = useSettings();
  const { progress } = useLenis();

  const handleLoadDemoData = () => {
    if (confirm(`This replaces the financial data currently stored in this browser with a demo scenario in ${currency}. Continue?`)) {
      if (onLoadDemoData) {
        onLoadDemoData(currency);
      }
    }
  };

  const handleResetData = () => {
    if (confirm("⚠️ Are you sure you want to WIPE ALL DATA? This cannot be undone.")) {
      if (onResetData) {
        onResetData();
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 shadow-xs">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2">

          {/* Logo & Brand Identity */}
          <div
            onClick={() => onChangeView('dashboard')}
            className="flex items-center gap-3 group cursor-pointer select-none flex-shrink-0"
            title="Go to your dashboard"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-all border border-amber-300/40">
              <GreekPillarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black font-serif tracking-tight text-slate-900">AUREUS</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold uppercase tracking-wider">PRO</span>
              </div>
              <p className="text-[9px] text-amber-700 font-bold tracking-widest uppercase -mt-0.5">AI-Assisted Wealth</p>
            </div>
          </div>

          {/* Central Executive View Tabs */}
          <nav className="flex items-center bg-slate-100/80 rounded-2xl p-1 border border-slate-200/60 shadow-xs">
            <button
              onClick={() => onChangeView('plan')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'plan'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <TargetIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">My plan</span>
            </button>

            <button
              onClick={() => onChangeView('dashboard')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ChartBarIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => onChangeView('ai')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'ai'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Aureus Intelligence</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold hidden md:inline">
                AI Suite
              </span>
            </button>

            <button
              onClick={() => onChangeView('reports')}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentView === 'reports'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ChartPieIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Quick Command Palette Search Button */}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors text-xs font-bold border border-slate-200/60"
                title="Command Palette (Ctrl+K or ⌘K)"
              >
                <SearchIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Search</span>
                <kbd className="hidden lg:inline-block text-[9px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                  ⌘K
                </kbd>
              </button>
            )}

            {/* Upload Statement Button */}
            {onOpenStatementUpload && (
              <button
                onClick={onOpenStatementUpload}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold transition-all shadow-xs"
                title="Upload bank statement (CSV or text)"
              >
                <DocumentArrowDownIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>Upload Statement</span>
              </button>
            )}

            {/* Goals Configurator Button */}
            {onOpenGoals && (
              <button
                onClick={onOpenGoals}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 text-xs font-bold transition-all shadow-xs"
                title="Configure wealth goals & timeline contributions"
              >
                <TargetIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Goals</span>
              </button>
            )}

            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-white text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-xs focus:outline-none focus:border-amber-500 cursor-pointer hover:bg-slate-50"
              title="Select display currency"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>

            {/* Budgets Button */}
            <button
              onClick={onManageBudgets}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/60 transition-colors"
            >
              <span>Budgets</span>
              {typeof budgetCount === 'number' && budgetCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white text-[10px] text-slate-700 font-bold border border-slate-200">
                  {budgetCount}
                </span>
              )}
            </button>

            {/* Debts Button */}
            {onManageDebts && (
              <button
                onClick={onManageDebts}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors"
              >
                <CreditCardIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>Debts</span>
                {typeof debtCount === 'number' && debtCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-[10px] text-rose-800 font-bold">
                    {debtCount}
                  </span>
                )}
              </button>
            )}

            {/* Notifications / Alerts */}
            <AlertsWidget
              alerts={alerts}
              onDismiss={onDismissAlert}
              onSnooze={onSnoozeAlert}
            />

            {/* Demo Button */}
            <button
              onClick={handleLoadDemoData}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/60 transition-colors"
              title="Load realistic demo dataset"
            >
              <ArrowPathIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Demo</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              className="hidden xl:flex items-center p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-xs"
              title="Reset all local data"
              aria-label="Reset all data"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lenis Real-Time Smooth Scroll Progress Line */}
      <div
        className="h-[2px] bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500 transition-all duration-75"
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </header>
  );
};

export default Header;
