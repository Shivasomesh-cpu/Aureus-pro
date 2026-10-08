import React, { useState, useMemo, useEffect } from 'react';
import { Budget, Category } from '../types';
import { CATEGORIES } from '../constants';
import { TrashIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id' | 'month'>) => void;
  onDelete: (id: string) => void;
  existingBudgets: Budget[];
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ isOpen, onClose, onSave, onDelete, existingBudgets }) => {
  const { formatCurrency } = useSettings();
  const [category, setCategory] = useState<Category>('Food');
  const [amount, setAmount] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthDisplay = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });


  const budgetsForCurrentMonth = useMemo(() => {
    return existingBudgets.filter(b => b.month === currentMonth);
  }, [existingBudgets, currentMonth]);
  
  const availableCategories = useMemo(() => {
      const budgetedCategories = budgetsForCurrentMonth.map(b => b.category);
      const expenseCategories = CATEGORIES.filter(c => c !== 'Salary' && c !== 'Investment' && c !== 'Other');
      return expenseCategories.filter(c => !budgetedCategories.includes(c));
  }, [budgetsForCurrentMonth]);
  
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(category)) {
      setCategory(availableCategories[0]);
    }
  }, [availableCategories, category]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSave({ category, amount: parseFloat(amount) });
    setAmount('');
    if(availableCategories.length > 1) {
        setCategory(availableCategories.find(c => c !== category) || availableCategories[0]);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg m-4">
        <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Manage Budgets</h2>
        <p className="text-md mb-6 text-gray-500 dark:text-gray-400">For {currentMonthDisplay}</p>
        
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Set New Budget</h3>
            {availableCategories.length > 0 ? (
                 <form onSubmit={handleSubmit} className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label htmlFor="budget-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            id="budget-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Category)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                        >
                            {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="budget-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                        <input
                            type="number"
                            id="budget-amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                            placeholder="500.00"
                            required
                            min="0.01"
                            step="0.01"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-md h-10">Add</button>
                </form>
            ) : <p className="text-sm text-gray-500 dark:text-gray-400">All available expense categories have a budget set.</p>}
        </div>

        <div className="max-h-60 overflow-y-auto pr-2">
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Current Budgets</h3>
            {budgetsForCurrentMonth.length > 0 ? (
                <ul className="space-y-2">
                    {budgetsForCurrentMonth.map(budget => (
                        <li key={budget.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <span className="font-medium">{budget.category}</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold">{formatCurrency(budget.amount)}</span>
                                <button onClick={() => onDelete(budget.id)} className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-center text-gray-500 dark:text-gray-400 py-4">No budgets set for this month.</p>}
        </div>

        <div className="flex justify-end mt-6">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-lg focus:outline-none"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
