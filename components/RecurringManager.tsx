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
        <div className="glass-card p-6 rounded-2xl h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    Recurring Expenses
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10 animate-fade-in-up">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Description (e.g., Netflix)"
                            className="glass-input w-full"
                            value={newRec.description}
                            onChange={e => setNewRec({ ...newRec, description: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Amount"
                                className="glass-input w-full"
                                value={newRec.amount || ''}
                                onChange={e => setNewRec({ ...newRec, amount: Number(e.target.value) })}
                                required
                            />
                            <select
                                className="glass-input w-full"
                                value={newRec.category}
                                onChange={e => setNewRec({ ...newRec, category: e.target.value as Category })}
                            >
                                {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-gray-800">{cat}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                className="glass-input w-full"
                                value={newRec.frequency}
                                onChange={e => setNewRec({ ...newRec, frequency: e.target.value as any })}
                            >
                                <option value="weekly" className="bg-gray-800">Weekly</option>
                                <option value="monthly" className="bg-gray-800">Monthly</option>
                                <option value="yearly" className="bg-gray-800">Yearly</option>
                            </select>
                            <input
                                type="date"
                                className="glass-input w-full"
                                value={newRec.nextDueDate}
                                onChange={e => setNewRec({ ...newRec, nextDueDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className="flex gap-2 justify-end mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Save</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {recurringTransactions.map(rec => (
                    <div key={rec.id} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all duration-300 flex justify-between items-center group relative">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${rec.type === TransactionType.INCOME ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                <span className="text-lg">{rec.type === TransactionType.INCOME ? '↓' : '↑'}</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-white tracking-wide text-sm">{rec.description}</h4>
                                <div className="flex gap-2 mt-0.5">
                                    <span className="text-[10px] uppercase tracking-wider font-medium text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{rec.frequency}</span>
                                    <span className="text-[10px] text-gray-400 py-0.5">Next: {new Date(rec.nextDueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className={`font-bold font-sans ${rec.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-white'}`}>
                                {formatCurrency(rec.amount)}
                            </span>
                            <button
                                onClick={() => onDeleteRecurring(rec.id)}
                                className="text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {recurringTransactions.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No recurring payments tracked.</p>
                        <p className="text-sm">Add subscriptions or rent!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecurringManager;
