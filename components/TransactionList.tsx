
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import CategoryPill from './CategoryPill';
import { EditIcon, TrashIcon, InfoIcon } from './icons';
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
      className="flex items-center justify-between p-3.5 md:p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-white/15 transition-all duration-300 group relative overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

      <div className="flex items-center space-x-3 pl-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-gray-200 group-hover:text-white transition-colors truncate">{transaction.description}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(transaction.date)}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {transaction.notes && (
          <div className="relative group/note">
            <InfoIcon className="w-4 h-4 text-gray-600 hover:text-gray-300 transition-colors cursor-help" />
            <div className="absolute bottom-full mb-2 right-0 w-56 bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
              <p className="text-xs text-gray-300 leading-relaxed">{transaction.notes}</p>
            </div>
          </div>
        )}

        {transaction.type === 'expense' && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${categoryBadgeClass(transaction.category)}`}>
            {transaction.category}
          </span>
        )}

        <p className={`font-bold text-sm md:text-base tabular-nums ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>

        {/* Action buttons — slide in on hover */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-3 group-hover:translate-x-0">
          <button onClick={() => onEdit(transaction)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" aria-label="Edit">
            <EditIcon className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(transaction.id)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors" aria-label="Delete">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
};

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        t.amount.toString().includes(searchTerm);
      const typeMatch = filterType === 'all' || t.type === filterType;
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      return searchMatch && typeMatch && categoryMatch;
    });
  }, [transactions, searchTerm, filterType, filterCategory]);

  return (
    <div className="glass-premium p-5 md:p-6 rounded-2xl w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white">Transaction History</h3>
          <p className="text-xs text-gray-500 mt-0.5">{filteredTransactions.length} of {transactions.length} transactions</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-amber-500/30 transition-colors cursor-pointer hover:bg-white/8">
            <option value="all" className="bg-slate-800">All Types</option>
            <option value={TransactionType.INCOME} className="bg-slate-800">Income</option>
            <option value={TransactionType.EXPENSE} className="bg-slate-800">Expense</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-amber-500/30 transition-colors cursor-pointer hover:bg-white/8">
            <option value="all" className="bg-slate-800">All Categories</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-800">{cat}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/20 input-glow transition-all hover:bg-white/[0.07]"
        />
      </div>

      {/* List */}
      {filteredTransactions.length > 0 ? (
        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
          <ul className="space-y-2">
            {filteredTransactions.map((transaction, i) => (
              <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEdit} onDelete={onDelete} index={i} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-16 flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-white/[0.03] rounded-full flex items-center justify-center mb-4 border border-white/5">
            <InfoIcon className="w-7 h-7 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No transactions match your filters.</p>
          <p className="text-gray-600 text-xs mt-1">Try adjusting your search or filters above.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionList;