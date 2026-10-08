import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import CategoryPill from './CategoryPill';
import { EditIcon, TrashIcon, InfoIcon, DocumentArrowDownIcon } from './icons';
import { CATEGORIES } from '../constants';
import { useSettings } from '../contexts/SettingsContext';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const categoryBadgeClass = (cat: Category): string => {
  const map: Record<string, string> = {
    Food: 'badge-food', Shopping: 'badge-shopping', Entertainment: 'badge-entertainment',
    Transportation: 'badge-transportation', Utilities: 'badge-utilities', Healthcare: 'badge-healthcare',
    Housing: 'badge-housing', Education: 'badge-education', Salary: 'badge-salary',
    Investment: 'badge-investment', Health: 'badge-healthcare',
  };
  return map[cat] || 'badge-other';
};

const TransactionItem: React.FC<{
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  index: number;
}> = ({ transaction, onEdit, onDelete, index }) => {
  const { formatCurrency, formatDate } = useSettings();
  const isIncome = transaction.type === TransactionType.INCOME;

  return (
    <li
      className="flex items-center justify-between p-3.5 md:p-4 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all duration-200 group relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 30, 240)}ms` }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-center space-x-3 pl-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-slate-800 group-hover:text-slate-900 transition-colors truncate">{transaction.description}</p>
            {transaction.aiGenerated && (
              <span className="text-[8px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{formatDate(transaction.date)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {transaction.notes && (
          <div className="relative group/note">
            <InfoIcon className="w-4 h-4 text-slate-400 hover:text-slate-600 transition-colors cursor-help" />
            <div className="absolute bottom-full mb-2 right-0 w-56 bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
              <p className="text-xs text-slate-200 leading-relaxed">{transaction.notes}</p>
            </div>
          </div>
        )}

        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${categoryBadgeClass(transaction.category)}`}>
          {transaction.category}
        </span>

        <p className={`font-bold text-sm md:text-base tabular-nums ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>

        {/* Action buttons — slide in on hover */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          <button onClick={() => onEdit(transaction)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Edit">
            <EditIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(transaction.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" aria-label="Delete">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  const { formatCurrency } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchMatch = !searchTerm ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.amount.toString().includes(searchTerm);
      const typeMatch = filterType === 'all' || t.type === filterType;
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      return searchMatch && typeMatch && categoryMatch;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  const { filteredIncome, filteredExpense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) inc += t.amount;
      else exp += t.amount;
    });
    return { filteredIncome: inc, filteredExpense: exp };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Notes'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aureus-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-premium p-5 md:p-6 rounded-2xl w-full bg-white border border-slate-200/80 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 tabular-nums">
              {filteredTransactions.length} of {transactions.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>In: <strong className="text-emerald-600 tabular-nums">+{formatCurrency(filteredIncome)}</strong></span>
            <span>•</span>
            <span>Out: <strong className="text-rose-600 tabular-nums">-{formatCurrency(filteredExpense)}</strong></span>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Segmented Type Controller */}
          <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200/80 p-0.5">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType(TransactionType.INCOME)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filterType === TransactionType.INCOME ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType(TransactionType.EXPENSE)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${filterType === TransactionType.EXPENSE ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Expenses
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            title="Export filtered transactions to CSV"
            className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Quick Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 custom-scrollbar">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
            filterCategory === 'all'
              ? 'bg-amber-100 border border-amber-300 text-amber-800'
              : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              filterCategory === cat
                ? 'bg-amber-100 border border-amber-300 text-amber-800'
                : 'bg-slate-100 border border-slate-200/60 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar with Clear Button */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search by description, notes, category, or amount..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 transition-colors text-xs font-bold"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-2">
            {filteredTransactions.map((transaction, i) => (
              <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEdit} onDelete={onDelete} index={i} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 border border-slate-200">
            <InfoIcon className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-700 text-sm font-bold">No transactions match your criteria</p>
          <p className="text-slate-500 text-xs mt-1">Try resetting the category filter or clearing your search phrase.</p>
          {(searchTerm || filterCategory !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => { setSearchTerm(''); setFilterCategory('all'); setFilterType('all'); }}
              className="mt-3 px-3 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-xs rounded-lg hover:bg-amber-200 transition-all font-bold"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionList;