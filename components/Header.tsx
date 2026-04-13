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
}

const Header: React.FC<HeaderProps> = ({
  currentView, onChangeView, onManageBudgets, onManageDebts,
  alerts, onDismissAlert, onSnoozeAlert
}) => {
  const { currency, setCurrency } = useSettings();

  const handleLoadDemoData = () => {
    if (confirm(`⚠️ Replace all data with a multi-month realistic middle-class scenario in ${currency}? This cannot be undone.`)) {
      const { transactions, budgets, savingsGoals, recurringTransactions, debts, subscriptions } = generateDemoData(currency) as any;
      saveTransactions(transactions);
      saveBudgets(budgets);
      saveSavingsGoals(savingsGoals);
      saveRecurringTransactions(recurringTransactions);
      saveDebts(debts);
      saveSubscriptions(subscriptions);
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (confirm("⚠️ Are you sure you want to WIPE ALL DATA? This cannot be undone.")) {
      clearData();
      window.location.reload();
    }
  };

  return (
    <header className="relative bg-slate-900/90 backdrop-blur-2xl border-b border-white/5 sticky top-0 z-50">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent bg-[length:200%_100%] animate-shimmer"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between items-center h-16 md:h-20">

          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer select-none">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-10 h-10 bg-gradient-to-tr from-yellow-500 via-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-lg shadow-amber-600/20 group-hover:scale-110 group-hover:shadow-amber-500/40 transition-all duration-300">
                <GreekPillarIcon className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight font-serif text-gradient-gold">AUREUS</h1>
              <p className="text-[9px] text-amber-500/70 font-semibold tracking-[0.25em] uppercase">AI-Powered Finance</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Reset Button */}
            <button
              onClick={handleResetData}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/8 text-rose-400/80 border border-rose-500/15 hover:bg-rose-500/15 hover:text-rose-300 hover:border-rose-500/30 transition-all duration-300 text-xs font-medium"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Reset
            </button>

            {/* Demo Button */}
            <button
              onClick={handleLoadDemoData}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/8 text-amber-400/80 border border-amber-500/15 hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30 transition-all duration-300 text-xs font-medium"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Demo
            </button>

            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="bg-slate-800/80 text-gray-300 text-xs font-medium px-3 py-2 rounded-xl border border-white/5 focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/30 transition-all cursor-pointer hover:bg-slate-700/80"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>

            {/* Budgets */}
            <button
              onClick={onManageBudgets}
              className="hidden sm:block px-3.5 py-2 rounded-xl bg-slate-800/80 text-gray-300 hover:bg-slate-700/80 hover:text-white transition-all duration-300 text-xs font-medium border border-white/5 hover:border-white/10"
            >
              Budgets
            </button>

            {/* Debts */}
            {onManageDebts && (
              <button
                onClick={onManageDebts}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/8 text-rose-400/80 hover:bg-rose-500/15 hover:text-rose-300 transition-all duration-300 text-xs font-medium border border-rose-500/15 hover:border-rose-500/25"
              >
                <CreditCardIcon className="w-3.5 h-3.5" />
                Debts
              </button>
            )}

            <div className="h-8 w-[1px] bg-white/5 mx-1 hidden sm:block"></div>

            <AlertsWidget
              alerts={alerts}
              onDismiss={onDismissAlert}
              onSnooze={onSnoozeAlert}
            />

            {/* View Toggles */}
            <div className="flex items-center bg-slate-800/60 rounded-xl border border-white/5 p-0.5">
              <button
                onClick={() => onChangeView('dashboard')}
                className={`p-2 rounded-lg transition-all duration-300 ${currentView === 'dashboard' ? 'bg-amber-500/15 text-amber-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                aria-label="Dashboard"
                title="Dashboard"
              >
                <ChartBarIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeView('ai')}
                className={`p-2 rounded-lg transition-all duration-300 ${currentView === 'ai' ? 'bg-violet-500/15 text-violet-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                aria-label="Aureus Intelligence"
                title="Aureus Intelligence"
              >
                <SparklesIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onChangeView('reports')}
                className={`p-2 rounded-lg transition-all duration-300 ${currentView === 'reports' ? 'bg-emerald-500/15 text-emerald-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                aria-label="Reports"
                title="Financial Analytics"
              >
                <ChartPieIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animated gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </header>
  );
};

export default Header;
