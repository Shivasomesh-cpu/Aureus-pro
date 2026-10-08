import React, { useState } from 'react';
import { RecurringTransaction, Category, TransactionType } from '../types';
import { CATEGORIES } from '../constants';
import { PlusIcon, TrashIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface RecurringManagerProps {
    recurringTransactions: RecurringTransaction[];
    onAddRecurring: (transaction: RecurringTransaction) => void;
    onDeleteRecurring: (id: string) => void;
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ recurringTransactions, onAddRecurring, onDeleteRecurring }) => {
    const { formatCurrency } = useSettings();
    const [isAdding, setIsAdding] = useState(false);
    const [newRec, setNewRec] = useState<Partial<RecurringTransaction>>({
        description: '',
        amount: 0,
        category: 'Other',
        frequency: 'monthly',
        nextDueDate: new Date().toISOString().split('T')[0],
        type: TransactionType.EXPENSE
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newRec.description && newRec.amount) {
            onAddRecurring({
                id: crypto.randomUUID(),
                type: newRec.type as TransactionType,
                amount: Number(newRec.amount),
                description: newRec.description,
                category: newRec.category as Category,
                frequency: newRec.frequency as 'weekly' | 'monthly' | 'yearly',
                nextDueDate: newRec.nextDueDate || new Date().toISOString().split('T')[0],
                isActive: true
            });
            setIsAdding(false);
            setNewRec({ ...newRec, description: '', amount: 0 });
        }
    };

    return (
        <div className="glass-card p-6 rounded-2xl h-full bg-white border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-lg">🔄</span>
                    Recurring Expenses
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-700 transition-colors border border-slate-200/60"
                    title="Add Recurring Item"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in-up">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Description (e.g., Netflix)"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            value={newRec.description}
                            onChange={e => setNewRec({ ...newRec, description: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Amount"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newRec.amount || ''}
                                onChange={e => setNewRec({ ...newRec, amount: Number(e.target.value) })}
                                required
                            />
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newRec.category}
                                onChange={e => setNewRec({ ...newRec, category: e.target.value as Category })}
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newRec.frequency}
                                onChange={e => setNewRec({ ...newRec, frequency: e.target.value as any })}
                            >
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newRec.nextDueDate}
                                onChange={e => setNewRec({ ...newRec, nextDueDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex gap-2 justify-end mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1">Cancel</button>
                            <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-colors shadow-xs">Save</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {recurringTransactions.map(rec => (
                    <div key={rec.id} className="bg-slate-50 border border-slate-200/70 p-3.5 rounded-xl hover:bg-slate-100/70 transition-all duration-200 flex justify-between items-center group relative shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${rec.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                <span className="text-base font-bold">{rec.type === TransactionType.INCOME ? '↓' : '↑'}</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-xs tracking-tight">{rec.description}</h4>
                                <div className="flex gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-white border border-slate-200/60 px-1.5 py-0.2 rounded">{rec.frequency}</span>
                                    <span className="text-[10px] text-slate-400 py-0.5">Next: {new Date(rec.nextDueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-xs tabular-nums ${rec.type === TransactionType.INCOME ? 'text-emerald-700' : 'text-slate-900'}`}>
                                {formatCurrency(rec.amount)}
                            </span>
                            <button
                                onClick={() => onDeleteRecurring(rec.id)}
                                className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {recurringTransactions.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-xs font-bold text-slate-600">No recurring payments tracked.</p>
                        <p className="text-[11px] mt-0.5">Add subscriptions or rent!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecurringManager;
