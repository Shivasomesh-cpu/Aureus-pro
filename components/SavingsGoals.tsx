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
        <div className="glass-card p-6 rounded-2xl h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <PiggyBankIcon className="w-6 h-6 text-emerald-400" />
                    Savings Goals
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
                            placeholder="Goal Name (e.g., Vacation)"
                            className="glass-input w-full"
                            value={newGoal.name}
                            onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                type="number"
                                placeholder="Target Amount"
                                className="glass-input w-full"
                                value={newGoal.targetAmount || ''}
                                onChange={e => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                                required
                            />
                            <input
                                type="date"
                                className="glass-input w-full"
                                value={newGoal.deadline}
                                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 justify-end mt-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-gray-400 hover:text-white px-3 py-1">Cancel</button>
                            <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">Save Goal</button>
                        </div>
                    </div>
                </form>
            )}

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {goals.map(goal => {
                    const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                        <div key={goal.id} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-all duration-300 group relative shadow-sm hover:shadow-md">
                            <button
                                onClick={() => onDeleteGoal(goal.id)}
                                className="absolute top-2 right-2 text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <h4 className="font-semibold text-white tracking-wide font-sans">{goal.name}</h4>
                                    {goal.deadline && <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Due {new Date(goal.deadline).toLocaleDateString()}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-400">
                                        {formatCurrency(goal.currentAmount)}
                                    </p>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        of {formatCurrency(goal.targetAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-3 overflow-hidden">
                                <div
                                    className="h-1.5 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.3)] relative"
                                    style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddFunds(goal, 10)}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-500/10"
                                >
                                    + {formatCurrency(10)}
                                </button>
                                <button
                                    onClick={() => handleAddFunds(goal, 50)}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-500/10"
                                >
                                    + {formatCurrency(50)}
                                </button>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && !isAdding && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No savings goals yet.</p>
                        <p className="text-sm">Set a target to start saving!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavingsGoals;
