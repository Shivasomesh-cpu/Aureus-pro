import React, { useState } from 'react';
import { Debt, DebtPayoffPlan } from '../types';
import { CreditCardIcon, PlusIcon, TrashIcon, XMarkIcon } from './icons';
import { calculateSnowballPlan, calculateAvalanchePlan, compareStrategies } from '../services/debtService';
import { useSettings } from '../contexts/SettingsContext';

interface DebtManagerProps {
    debts: Debt[];
    onAddDebt: (debt: Debt) => void;
    onDeleteDebt: (id: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAddDebt, onDeleteDebt, isOpen, onClose }) => {
    const { currencySymbol, formatCurrency } = useSettings();
    const [showAddForm, setShowAddForm] = useState(false);
    const [extraPayment, setExtraPayment] = useState(0);
    const [selectedStrategy, setSelectedStrategy] = useState<'snowball' | 'avalanche'>('avalanche');

    const [newDebt, setNewDebt] = useState<Partial<Debt>>({
        name: '',
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        dueDate: 1,
        type: 'credit_card',
        creditor: '',
    });

    if (!isOpen) return null;

    const handleAddDebt = () => {
        if (newDebt.name && newDebt.balance && newDebt.minimumPayment) {
            onAddDebt({
                id: crypto.randomUUID(),
                name: newDebt.name,
                balance: newDebt.balance,
                interestRate: newDebt.interestRate || 0,
                minimumPayment: newDebt.minimumPayment,
                dueDate: newDebt.dueDate || 1,
                type: newDebt.type || 'credit_card',
                creditor: newDebt.creditor || '',
            });
            setNewDebt({
                name: '',
                balance: 0,
                interestRate: 0,
                minimumPayment: 0,
                dueDate: 1,
                type: 'credit_card',
                creditor: '',
            });
            setShowAddForm(false);
        }
    };

    const comparison = debts.length > 0 ? compareStrategies(debts, extraPayment) : null;
    const currentPlan = selectedStrategy === 'snowball' ? comparison?.snowball : comparison?.avalanche;

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center">
                            <CreditCardIcon className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Debt Manager</h2>
                            <p className="text-sm text-gray-400">Track and pay off your debts</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
                    {/* Summary */}
                    {debts.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-400 mb-1">Total Debt</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalDebt)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-400 mb-1">Min. Payment</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalMinPayment)}</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-sm text-gray-400 mb-1">Accounts</p>
                                <p className="text-2xl font-bold text-white">{debts.length}</p>
                            </div>
                        </div>
                    )}

                    {/* Debt List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Your Debts</h3>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Add Debt
                            </button>
                        </div>

                        {showAddForm && (
                            <div className="bg-white/5 rounded-xl p-4 mb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Debt Name"
                                        value={newDebt.name}
                                        onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                        className="glass-input px-3 py-2 rounded-lg text-sm"
                                    />
                                    <select
                                        value={newDebt.type}
                                        onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as any })}
                                        className="glass-input px-3 py-2 rounded-lg text-sm"
                                    >
                                        <option value="credit_card">Credit Card</option>
                                        <option value="personal_loan">Personal Loan</option>
                                        <option value="student_loan">Student Loan</option>
                                        <option value="auto_loan">Auto Loan</option>
                                        <option value="mortgage">Mortgage</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <input
                                        type="number"
                                        placeholder="Balance"
                                        value={newDebt.balance || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-lg text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Interest Rate %"
                                        value={newDebt.interestRate || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-lg text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Min. Payment"
                                        value={newDebt.minimumPayment || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddDebt}
                                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {debts.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCardIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-400">No debts added yet</p>
                                <p className="text-sm text-gray-500 mt-1">Add your debts to create a payoff plan</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {debts.map((debt) => (
                                    <div key={debt.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-white">{debt.name}</h4>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                                                    {debt.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-gray-400">
                                                    Balance: <span className="text-white font-medium">{formatCurrency(debt.balance)}</span>
                                                </span>
                                                <span className="text-gray-400">
                                                    APR: <span className="text-white font-medium">{debt.interestRate}%</span>
                                                </span>
                                                <span className="text-gray-400">
                                                    Min: <span className="text-white font-medium">{formatCurrency(debt.minimumPayment)}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteDebt(debt.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-rose-500/20 transition-colors text-rose-400"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payoff Strategy */}
                    {debts.length > 0 && comparison && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Payoff Strategy</h3>

                            <div className="bg-white/5 rounded-xl p-4 mb-4">
                                <label className="text-sm text-gray-400 mb-2 block">Extra Monthly Payment</label>
                                <input
                                    type="number"
                                    value={extraPayment}
                                    onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                                    className="glass-input px-3 py-2 rounded-lg text-sm w-full"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => setSelectedStrategy('snowball')}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedStrategy === 'snowball'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <h4 className="font-semibold text-white mb-1">Snowball</h4>
                                    <p className="text-xs text-gray-400">Pay smallest balance first</p>
                                </button>
                                <button
                                    onClick={() => setSelectedStrategy('avalanche')}
                                    className={`p-4 rounded-xl border-2 transition-all ${selectedStrategy === 'avalanche'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    <h4 className="font-semibold text-white mb-1">Avalanche</h4>
                                    <p className="text-xs text-gray-400">Pay highest interest first</p>
                                </button>
                            </div>

                            {currentPlan && (
                                <div className="bg-gradient-to-br from-primary-500/10 to-emerald-500/10 rounded-xl p-4 border border-primary-500/20">
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Payoff Date</p>
                                            <p className="text-lg font-bold text-white">
                                                {new Date(currentPlan.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Total Interest</p>
                                            <p className="text-lg font-bold text-white">{formatCurrency(currentPlan.totalInterest)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Months to Freedom</p>
                                            <p className="text-lg font-bold text-white">{currentPlan.totalMonths}</p>
                                        </div>
                                    </div>

                                    {comparison.recommendation && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                            <p className="text-sm text-emerald-400">
                                                💡 {comparison.recommendation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebtManager;
