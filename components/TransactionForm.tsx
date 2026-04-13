
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { CATEGORIES } from '../constants';
import { suggestCategory } from '../services/geminiService';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transactionToEdit?: Transaction | null;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSave, transactionToEdit }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const descriptionDebounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(String(transactionToEdit.amount));
      setDescription(transactionToEdit.description);
      setCategory(transactionToEdit.category);
      setDate(new Date(transactionToEdit.date).toISOString().split('T')[0]);
      setNotes(transactionToEdit.notes || '');
    } else {
      // Reset form
      setType(TransactionType.EXPENSE);
      setAmount('');
      setDescription('');
      setCategory('Other');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [transactionToEdit, isOpen]);

  useEffect(() => {
    if (descriptionDebounceTimeout.current) {
      clearTimeout(descriptionDebounceTimeout.current);
    }
    if (description.length > 3 && type === TransactionType.EXPENSE) {
      setIsSuggesting(true);
      descriptionDebounceTimeout.current = window.setTimeout(async () => {
        const suggested = await suggestCategory(description);
        if (suggested) {
          setCategory(suggested);
        }
        setIsSuggesting(false);
      }, 1000);
    } else {
      setIsSuggesting(false);
    }

    return () => {
      if (descriptionDebounceTimeout.current) {
        clearTimeout(descriptionDebounceTimeout.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    onSave({
      id: transactionToEdit ? transactionToEdit.id : new Date().toISOString(),
      type,
      amount: parseFloat(amount),
      description,
      category: type === TransactionType.INCOME ? 'Salary' : category,
      date: new Date(date).toISOString(),
      notes: notes.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setType(TransactionType.EXPENSE)}
                className={`flex-1 py-2 px-4 rounded-l-md focus:outline-none ${type === TransactionType.EXPENSE ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType(TransactionType.INCOME)}
                className={`flex-1 py-2 px-4 rounded-r-md focus:outline-none ${type === TransactionType.INCOME ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              >
                Income
              </button>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Coffee with friends"
              required
            />
          </div>
          {type === TransactionType.EXPENSE && (
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white appearance-none"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {isSuggesting && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary-500">Suggesting...</span>}
              </div>
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Add any extra details..."
            />
          </div>
          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-lg focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;