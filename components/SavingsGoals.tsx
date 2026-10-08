import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { PiggyBankIcon, PlusIcon, TrashIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface SavingsGoalsProps {
    goals: SavingsGoal[];
    onAddGoal: (goal: SavingsGoal) => void;
    onUpdateGoal: (goal: SavingsGoal) => void;
    onDeleteGoal: (id: string) => void;
}

const SavingsGoals: React.FC<SavingsGoalsProps> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal }) => {
    const { formatCurrency } = useSettings();
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        deadline: '',
        color: '#10b981'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGoal.name && newGoal.targetAmount) {
            onAddGoal({
                id: crypto.randomUUID(),
                name: newGoal.name,
                targetAmount: Number(newGoal.targetAmount),
                currentAmount: Number(newGoal.currentAmount || 0),
                deadline: newGoal.deadline || '',
                color: newGoal.color || '#10b981'
            });
            setIsAdding(false);
            setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, deadline: '', color: '#10b981' });
        }
    };

    const handleAddFunds = (goal: SavingsGoal, amount: number) => {
        const updated = { ...goal, currentAmount: goal.currentAmount + amount };
        onUpdateGoal(updated);
    };

    return (
        <div className="glass-card p-6 rounded-2xl h-full bg-white border border-slate-200/80 shadow-xs">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PiggyBankIcon className="w-5 h-5 text-emerald-600" />
                    Savings Goals
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-700 transition-colors border border-slate-200/60"
                    title="Add Goal"
                >
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-fade-in-up">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Goal Name (e.g., Vacation)"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                            value={newGoal.name}
                            onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Target Amount"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newGoal.targetAmount || ''}
                                onChange={e => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                                required
                            />
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                value={newGoal.deadline}
                                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1">Cancel</button>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-colors shadow-xs">Save Goal</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {goals.map(goal => {
                    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <div key={goal.id} className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl hover:bg-slate-100/70 transition-all duration-200 group relative shadow-xs">
                            <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="flex justify-between items-end mb-2.5">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900 tracking-tight">{goal.name}</h4>
                                    {goal.deadline && <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Due {new Date(goal.deadline).toLocaleDateString()}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-700 tabular-nums">
                                        {formatCurrency(goal.currentAmount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        of {formatCurrency(goal.targetAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
                                <div
                                    className="h-2 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                                ></div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddFunds(goal, 10)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                                >
                                    + {formatCurrency(10)}
                                </button>
                                <button
                                    onClick={() => handleAddFunds(goal, 50)}
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors border border-emerald-200"
                                >
                                    + {formatCurrency(50)}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-slate-400">
                        <p className="text-xs font-bold text-slate-600">No savings goals yet.</p>
                        <p className="text-[11px] mt-0.5">Set a target to start saving!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavingsGoals;
