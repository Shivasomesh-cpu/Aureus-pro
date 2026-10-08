import React, { useState, useMemo } from 'react';
import { Debt, DebtPayoffPlan } from '../types';
import { CreditCardIcon, PlusIcon, TrashIcon, XMarkIcon, SparklesIcon, CalendarIcon, ScaleIcon } from './icons';
import { calculateSnowballPlan, calculateAvalanchePlan, compareStrategies, WindfallInjection } from '../services/debtService';
import { useSettings } from '../contexts/SettingsContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

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
    const [showAmortizationTable, setShowAmortizationTable] = useState(false);

    // Windfall bonus injection state
    const [windfallAmount, setWindfallAmount] = useState<number>(0);
    const [windfallMonth, setWindfallMonth] = useState<number>(3); // e.g. Month 3 bonus

    const [newDebt, setNewDebt] = useState<Partial<Debt>>({
        name: '',
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        dueDate: 1,
        type: 'credit_card',
        creditor: '',
    });

    const windfall: WindfallInjection | undefined = useMemo(() => {
        if (windfallAmount > 0) {
            return { amount: windfallAmount, month: Math.max(1, windfallMonth) };
        }
        return undefined;
    }, [windfallAmount, windfallMonth]);

    const comparison = useMemo(() => {
        if (debts.length === 0) return null;
        return compareStrategies(debts, extraPayment, windfall);
    }, [debts, extraPayment, windfall]);

    const currentPlan = selectedStrategy === 'snowball' ? comparison?.snowball : comparison?.avalanche;

    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);

    if (!isOpen) return null;

    const handleAddDebt = () => {
        if (newDebt.name?.trim() && Number(newDebt.balance) > 0 && Number(newDebt.minimumPayment) > 0 && Number(newDebt.interestRate ?? 0) >= 0) {
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

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-slate-900/95 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/10 bg-slate-950/40 flex-shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/10">
                            <CreditCardIcon className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white tracking-tight">Interactive Debt Architect</h2>
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300">
                                    Avalanche vs Snowball
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">Month-by-month trajectory modeling, simultaneous payoff pools & windfall injections</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white border border-white/5"
                        aria-label="Close dialog"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar flex-1">
                    {/* Summary KPI Strip */}
                    {debts.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Balance</p>
                                <p className="text-xl md:text-2xl font-bold text-white tabular-nums">{formatCurrency(totalDebt)}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Minimums</p>
                                <p className="text-xl md:text-2xl font-bold text-amber-400 tabular-nums">{formatCurrency(totalMinPayment)}/mo</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Active Accounts</p>
                                <p className="text-xl md:text-2xl font-bold text-blue-400 tabular-nums">{debts.length}</p>
                            </div>
                            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Avalanche Advantage</p>
                                <p className="text-xl md:text-2xl font-bold text-emerald-400 tabular-nums">
                                    +{formatCurrency(comparison?.interestSaved || 0)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Debt List Controls */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Active Debt Accounts</h3>
                                <p className="text-xs text-gray-500">Sorted automatically by prioritized payoff strategies</p>
                            </div>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-xl transition-all text-xs font-semibold shadow-md shadow-rose-600/20"
                            >
                                <PlusIcon className="w-3.5 h-3.5" />
                                {showAddForm ? 'Cancel' : 'Add Account'}
                            </button>
                        </div>

                        {showAddForm && (
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3 animate-fade-in-up">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Account Name (e.g. Visa Signature)"
                                        value={newDebt.name}
                                        onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                        className="glass-input px-3 py-2 rounded-xl text-xs"
                                    />
                                    <select
                                        value={newDebt.type}
                                        onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value as any })}
                                        className="glass-input px-3 py-2 rounded-xl text-xs bg-slate-800"
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
                                        min="0.01"
                                        placeholder="Balance"
                                        value={newDebt.balance || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-xl text-xs"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="Interest Rate % (APR)"
                                        value={newDebt.interestRate || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-xl text-xs"
                                    />
                                    <input
                                        type="number"
                                        min="0.01"
                                        placeholder="Min. Payment"
                                        value={newDebt.minimumPayment || ''}
                                        onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) || 0 })}
                                        className="glass-input px-3 py-2 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        onClick={() => setShowAddForm(false)}
                                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddDebt}
                                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                                    >
                                        Save Debt
                                    </button>
                                </div>
                            </div>
                        )}

                        {debts.length === 0 ? (
                            <div className="text-center py-10">
                                <CreditCardIcon className="w-10 h-10 text-gray-600 mx-auto mb-2.5 opacity-60" />
                                <p className="text-sm font-semibold text-gray-400">Zero debt accounts configured</p>
                                <p className="text-xs text-gray-500 mt-0.5">Add an account or load demo data to model accelerated debt freedom.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {debts.map((debt) => (
                                    <div key={debt.id} className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 flex items-center justify-between hover:border-white/10 transition-colors">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-sm text-white truncate">{debt.name}</h4>
                                                <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                                                    {debt.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 tabular-nums">
                                                <span>Bal: <strong className="text-gray-200">{formatCurrency(debt.balance)}</strong></span>
                                                <span>APR: <strong className="text-rose-400">{debt.interestRate}%</strong></span>
                                                <span>Min: <strong className="text-gray-200">{formatCurrency(debt.minimumPayment)}</strong></span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteDebt(debt.id)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors flex-shrink-0"
                                            title="Delete debt"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Strategic Acceleration Controls: Extra Monthly & Windfall Injection */}
                    {debts.length > 0 && comparison && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Extra Monthly Payment */}
                                <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 md:p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <span>Extra Monthly Acceleration</span>
                                        </label>
                                        <span className="text-xs font-bold text-primary-400 tabular-nums">
                                            +{formatCurrency(extraPayment)}/mo
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="2000"
                                        step="25"
                                        value={extraPayment}
                                        onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                                        className="w-full accent-primary-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
                                        <span>{formatCurrency(0)}</span>
                                        <span>{formatCurrency(500)}</span>
                                        <span>{formatCurrency(1000)}</span>
                                        <span>{formatCurrency(2000)}</span>
                                    </div>
                                </div>

                                {/* Dynamic Windfall Injection */}
                                <div className="bg-gradient-to-br from-amber-500/10 to-emerald-500/5 border border-amber-500/20 rounded-2xl p-4 md:p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                            <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
                                            <span>Windfall Injection (Bonus/Tax Return)</span>
                                        </label>
                                        {windfallAmount > 0 && (
                                            <span className="text-xs font-bold text-emerald-400 tabular-nums">
                                                +{formatCurrency(windfallAmount)} in Mo {windfallMonth}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div>
                                            <label className="text-[10px] text-gray-400 mb-1 block">Lump Sum Amount</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="100"
                                                value={windfallAmount || ''}
                                                placeholder="e.g. 1500"
                                                onChange={(e) => setWindfallAmount(parseFloat(e.target.value) || 0)}
                                                className="glass-input px-3 py-1.5 rounded-xl text-xs w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 mb-1 block">Inject in Month #</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="24"
                                                value={windfallMonth || ''}
                                                placeholder="e.g. 3"
                                                onChange={(e) => setWindfallMonth(parseInt(e.target.value) || 1)}
                                                className="glass-input px-3 py-1.5 rounded-xl text-xs w-full"
                                            />
                                        </div>
                                    </div>
                                    {comparison.windfallImpact && comparison.windfallImpact.interestSaved > 0 && (
                                        <p className="text-[11px] text-emerald-400 font-semibold mt-2.5 flex items-center gap-1">
                                            ✨ Windfall saves {formatCurrency(comparison.windfallImpact.interestSaved)} in interest & {comparison.windfallImpact.monthsSaved} extra months!
                                        </p>
                                    )}
                                </div>
                            </div>

                            {(!comparison.avalanche.payoffPossible || !comparison.snowball.payoffPossible) && (
                                <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs leading-5 text-rose-200">
                                    At least one plan does not repay all balances within 50 years. Increase the minimum payment or monthly amount, and check that each payment exceeds the interest accruing on its balance.
                                </div>
                            )}

                            {/* Strategy Selectors */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <button
                                    onClick={() => setSelectedStrategy('avalanche')}
                                    className={`p-4 rounded-2xl border text-left transition-all ${
                                        selectedStrategy === 'avalanche'
                                            ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                            <span>⚡ Avalanche Method</span>
                                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold uppercase">Optimal</span>
                                        </h4>
                                        <span className="text-xs font-bold text-emerald-400">
                                            {formatCurrency(comparison.avalanche.totalInterest)} Int.
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Target highest APR debt first. Minimizes lifetime interest mathematically.</p>
                                    <div className="mt-2.5 pt-2 border-t border-white/5 flex justify-between text-xs text-gray-300">
                                        <span>Duration: <strong>{comparison.avalanche.payoffPossible ? `${comparison.avalanche.totalMonths} mos` : 'Beyond 50 yrs'}</strong></span>
                                        <span>Freedom: <strong>{comparison.avalanche.payoffPossible ? new Date(comparison.avalanche.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not reached'}</strong></span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedStrategy('snowball')}
                                    className={`p-4 rounded-2xl border text-left transition-all ${
                                        selectedStrategy === 'snowball'
                                            ? 'border-primary-500/50 bg-primary-500/10 shadow-lg shadow-primary-500/10'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                            <span>❄️ Snowball Method</span>
                                            <span className="text-[9px] bg-primary-500/20 text-primary-300 px-1.5 py-0.2 rounded font-bold uppercase">Momentum</span>
                                        </h4>
                                        <span className="text-xs font-bold text-primary-400">
                                            {formatCurrency(comparison.snowball.totalInterest)} Int.
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Target smallest balance first. Creates quick psychological motivation wins.</p>
                                    <div className="mt-2.5 pt-2 border-t border-white/5 flex justify-between text-xs text-gray-300">
                                        <span>Duration: <strong>{comparison.snowball.payoffPossible ? `${comparison.snowball.totalMonths} mos` : 'Beyond 50 yrs'}</strong></span>
                                        <span>Freedom: <strong>{comparison.snowball.payoffPossible ? new Date(comparison.snowball.payoffDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Not reached'}</strong></span>
                                    </div>
                                </button>
                            </div>

                            {/* Side-by-Side Payoff Trajectory Chart */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                            Payoff Trajectory Comparison (Avalanche vs Snowball)
                                        </h4>
                                        <p className="text-[11px] text-gray-500">Remaining combined debt balance over time</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAmortizationTable(!showAmortizationTable)}
                                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 self-start sm:self-auto"
                                    >
                                        {showAmortizationTable ? 'Hide Monthly Table' : 'View Full Amortization Table'}
                                    </button>
                                </div>

                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={comparison.trajectoryComparison} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                            <XAxis
                                                dataKey="month"
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickLine={false}
                                                tickFormatter={(m) => `M${m}`}
                                            />
                                            <YAxis
                                                stroke="#64748b"
                                                fontSize={10}
                                                tickLine={false}
                                                tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                                                formatter={(value: any, name: any) => [
                                                    formatCurrency(Number(value)),
                                                    name === 'avalancheBalance' ? 'Avalanche' : 'Snowball'
                                                ]}
                                                labelFormatter={(l) => `Month ${l}`}
                                            />
                                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                            <Line
                                                type="monotone"
                                                dataKey="avalancheBalance"
                                                name="Avalanche"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                dot={false}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="snowballBalance"
                                                name="Snowball"
                                                stroke="#38bdf8"
                                                strokeWidth={2}
                                                strokeDasharray="4 4"
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center gap-2">
                                    <span className="text-sm">💡</span>
                                    <p className="text-xs text-gray-300 leading-relaxed">
                                        {comparison.recommendation}
                                    </p>
                                </div>
                            </div>

                            {/* Month-by-Month Amortization Schedule Table */}
                            {showAmortizationTable && currentPlan && currentPlan.trajectory && (
                                <div className="bg-slate-950/60 border border-white/8 rounded-2xl p-4 md:p-5 animate-fade-in-up">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                                            Month-by-Month Amortization Schedule ({selectedStrategy.toUpperCase()})
                                        </h4>
                                        <span className="text-[11px] text-gray-400">Total {currentPlan.trajectory.length} Months</span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar border border-white/5 rounded-xl">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-gray-400 uppercase text-[10px] sticky top-0 backdrop-blur-md">
                                                <tr>
                                                    <th className="p-2.5">Month</th>
                                                    <th className="p-2.5">Remaining Balance</th>
                                                    <th className="p-2.5">Principal Paid</th>
                                                    <th className="p-2.5">Interest Paid</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-gray-300 tabular-nums">
                                                {currentPlan.trajectory.map((row) => (
                                                    <tr key={row.month} className="hover:bg-white/[0.02]">
                                                        <td className="p-2 font-medium">Month {row.month}</td>
                                                        <td className="p-2 font-bold text-white">{formatCurrency(row.totalBalance)}</td>
                                                        <td className="p-2 text-emerald-400">+{formatCurrency(row.principalPaid)}</td>
                                                        <td className="p-2 text-rose-400">-{formatCurrency(row.interestPaid)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
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
