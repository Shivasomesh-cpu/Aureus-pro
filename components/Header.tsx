import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { ChartPieIcon, ChartBarIcon, ArrowPathIcon, GreekPillarIcon, TrashIcon, CreditCardIcon, SparklesIcon } from './icons';
import { generateDemoData, clearData } from '../utils/dataSeeder';
import { saveTransactions, saveBudgets, saveSavingsGoals, saveRecurringTransactions, saveDebts, saveSubscriptions } from '../services/storageService';
import AlertsWidget from './AlertsWidget';
import { Alert } from '../types';

interface HeaderProps {
  currentView: 'dashboard' | 'reports' | 'ai';
  onChangeView: (view: 'dashboard' | 'reports' | 'ai') => void;
  onManageBudgets: () => void;
  onManageDebts?: () => void;
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
  alerts,
  onDismissAlert,
  onSnoozeAlert,
  onLoadDemoData,
  onResetData,
  budgetCount,
  debtCount
}) => {
  const { currency, setCurrency } = useSettings();

  const handleLoadDemoData = async () => {
    if (confirm(`⚠️ Load a multi-month realistic middle-class financial scenario in ${currency}?`)) {
      if (onLoadDemoData) {
        onLoadDemoData(currency);
      } else {
        const demo = generateDemoData(currency) as any;
        await saveTransactions(demo.transactions);
        saveBudgets(demo.budgets);
        saveSavingsGoals(demo.savingsGoals);
        saveRecurringTransactions(demo.recurringTransactions);
        saveDebts(demo.debts);
        saveSubscriptions(demo.subscriptions);
        window.location.reload();
      }
    }
  };

  const handleResetData = () => {
    if (confirm("⚠️ Are you sure you want to WIPE ALL DATA? This cannot be undone.")) {
      if (onResetData) {
        onResetData();
      } else {
        clearData();
        window.location.reload();
      }
    }
  };

  return (
    <header className="relative bg-slate-900/90 backdrop-blur-2xl border-b border-white/8 sticky top-0 z-50">
      {/* Animated gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent bg-[length:200%_100%] animate-shimmer"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16 md:h-20 gap-2">

          {/* Logo & Brand Identity */}
          <div
            onClick={() => onChangeView('dashboard')}
            className="flex items-center gap-3 group cursor-pointer select-none flex-shrink-0"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-10 h-10 bg-gradient-to-tr from-yellow-500 via-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:scale-105 group-hover:shadow-amber-500/40 transition-all duration-300 border border-amber-400/20">
                <GreekPillarIcon className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black tracking-tight font-serif text-gradient-gold">AUREUS</h1>
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold tracking-wider">PRO</span>
              </div>
              <p className="text-[9px] text-amber-500/70 font-semibold tracking-[0.22em] uppercase">AI-Assisted Wealth</p>
            </div>
          </div>

          {/* Central Executive View Tabs */}
          <nav className="flex items-center bg-slate-950/70 rounded-2xl border border-white/8 p-1 shadow-inner shadow-black/40">
            <button
              onClick={() => onChangeView('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </button>

            <button
              onClick={() => onChangeView('ai')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 relative ${
                currentView === 'ai'
                  ? 'bg-gradient-to-r from-violet-600/25 to-purple-600/15 text-violet-300 border border-violet-500/30 shadow-md shadow-violet-500/15'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <SparklesIcon className="w-4 h-4 text-violet-400 animate-pulse" />
              <span className="hidden md:inline">Aureus Intelligence</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold hidden lg:inline">
                AI
              </span>
            </button>

            <button
              onClick={() => onChangeView('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                currentView === 'reports'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-600/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <ChartPieIcon className="w-4 h-4" />
              <span className="hidden md:inline">Analytics</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Demo Button */}
            <button
              onClick={handleLoadDemoData}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-300 text-xs font-semibold shadow-sm"
              title="Load realistic Kaggle multi-month demo dataset"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>

            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-slate-900/90 text-gray-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all cursor-pointer hover:bg-slate-800"
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-gray-300 hover:bg-slate-700 hover:text-white transition-all duration-300 text-xs font-semibold border border-white/10"
            >
              <span>Budgets</span>
              {typeof budgetCount === 'number' && budgetCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] text-gray-300">
                  {budgetCount}
                </span>
              )}
            </button>

            {/* Debts Button */}
            {onManageDebts && (
              <button
                onClick={onManageDebts}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-all duration-300 text-xs font-semibold border border-rose-500/20 hover:border-rose-500/35"
              >
                <CreditCardIcon className="w-3.5 h-3.5" />
                <span>Debts</span>
                {typeof debtCount === 'number' && debtCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md bg-rose-500/20 text-[10px] text-rose-200">
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

            {/* Reset Button */}
            <button
              onClick={handleResetData}
              className="hidden xl:flex items-center p-2 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-300 text-xs"
              title="Reset and clear all local data"
              aria-label="Reset all data"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle border line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </header>
  );
};

export default Header;
