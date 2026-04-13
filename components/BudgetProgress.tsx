import React, { useMemo } from 'react';
import { Budget, Transaction, TransactionType, Category } from '../types';

interface BudgetProgressProps {
  budgets: Budget[];
  transactions: Transaction[];
}

import { useSettings } from '../contexts/SettingsContext';

const ProgressBar: React.FC<{ value: number; max: number; category: Category }> = ({ value, max, category }) => {
  const { formatCurrency } = useSettings();
  const percentage = max > 0 ? (value / max) * 100 : 0;
  let colorClass = 'bg-gradient-to-r from-emerald-500 to-emerald-400';

  if (percentage > 90) {
    colorClass = 'bg-gradient-to-r from-rose-500 to-rose-400';
  } else if (percentage > 75) {
    colorClass = 'bg-gradient-to-r from-amber-500 to-amber-400';
  }

  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-medium text-gray-300 font-sans tracking-tight">{category}</span>
        <div className="text-right">
          <span className="text-xs font-semibold text-white">{formatCurrency(value)}</span>
          <span className="text-[10px] text-gray-500 ml-1">/ {formatCurrency(max)}</span>
        </div>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm border border-white/5">
        <div
          className={`${colorClass} h-1.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      {percentage > 100 && (
        <p className="text-[10px] text-rose-400 mt-1 font-medium tracking-wide">Exceeded by {((percentage - 100)).toFixed(0)}%</p>
      )}
    </div>
  );
};


const BudgetProgress: React.FC<BudgetProgressProps> = ({ budgets, transactions }) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const monthlySpending = useMemo(() => {
    const spendingMap = new Map<Category, number>();
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth))
      .forEach(t => {
        spendingMap.set(t.category, (spendingMap.get(t.category) || 0) + t.amount);
      });
    return spendingMap;
  }, [transactions, currentMonth]);

  const activeBudgets = useMemo(() => {
    return budgets.filter(b => b.month === currentMonth);
  }, [budgets, currentMonth]);


  if (activeBudgets.length === 0) {
    return (
      <div className="glass-card p-6 rounded-2xl h-full text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Monthly Budgets</h3>
        <p className="text-gray-500 dark:text-gray-400">You haven't set any budgets for this month.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">Click "Manage Budgets" to get started.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-2xl h-full">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
        Budget Progress
      </h3>
      <div className="space-y-6">
        {activeBudgets.map(budget => (
          <ProgressBar
            key={budget.id}
            category={budget.category}
            value={monthlySpending.get(budget.category) || 0}
            max={budget.amount}
          />
        ))}
      </div>
    </div>
  );
};

export default BudgetProgress;
