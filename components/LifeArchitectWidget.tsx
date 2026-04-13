import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, Budget, SavingsGoal, Debt, FinancialHealthScore, BehavioralProfile } from '../types';
import {
    runLifeArchitect,
    createGoalFromPreset,
    PRESET_GOALS,
    LifeGoal,
    LifeArchitectResult,
    OptimizedPath,
    PathType,
    PresetGoal
} from '../services/lifeArchitectService';

interface LifeArchitectWidgetProps {
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    debts: Debt[];
    healthScore: FinancialHealthScore | null;
    behavioralProfile: BehavioralProfile | null;
}

const PATH_COLORS: Record<PathType, { gradient: string; text: string; bg: string; border: string; glow: string }> = {
    accelerated: {
        gradient: 'from-rose-500 to-orange-500',
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20',
        glow: 'shadow-orange-500/20',
    },
    balanced: {
        gradient: 'from-blue-500 to-cyan-500',
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/20',
        glow: 'shadow-cyan-500/20',
    },
    sustainable: {
        gradient: 'from-emerald-500 to-teal-500',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/20',
    },
};

const BURNOUT_COLORS = {
    low: 'text-emerald-400 bg-emerald-500/10',
    moderate: 'text-amber-400 bg-amber-500/10',
    high: 'text-rose-400 bg-rose-500/10',
};

const LifeArchitectWidget: React.FC<LifeArchitectWidgetProps> = ({
    transactions, budgets, savingsGoals, debts, healthScore, behavioralProfile
}) => {
    const [selectedPreset, setSelectedPreset] = useState<PresetGoal | null>(null);
    const [customGoal, setCustomGoal] = useState<LifeGoal | null>(null);
    const [activePath, setActivePath] = useState<PathType | null>(null);
    const [showAdjustments, setShowAdjustments] = useState(false);

    // Calculate base monthly income for presets
    const monthlyIncome = useMemo(() => {
        const incomeTransactions = transactions.filter(t => t.type === 'income');
        if (incomeTransactions.length === 0) return 5000;
        const total = incomeTransactions.reduce((s, t) => s + t.amount, 0);
        const dates = transactions.map(t => new Date(t.date).getTime());
        const months = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30));
        return total / months;
    }, [transactions]);

    const handlePresetSelect = useCallback((preset: PresetGoal) => {
        setSelectedPreset(preset);
        setCustomGoal(createGoalFromPreset(preset, monthlyIncome));
        setActivePath(null);
        setShowAdjustments(false);
    }, [monthlyIncome]);

    const result: LifeArchitectResult | null = useMemo(() => {
        if (!customGoal) return null;
        return runLifeArchitect(customGoal, transactions, savingsGoals, debts, healthScore, behavioralProfile);
    }, [customGoal, transactions, savingsGoals, debts, healthScore, behavioralProfile]);

    const selectedPathData = useMemo(() => {
        if (!activePath || !result) return null;
        return result.paths.find(p => p.type === activePath) || null;
    }, [activePath, result]);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val.toLocaleString()}`;
    };

    const getProbabilityColor = (prob: number) => {
        if (prob >= 75) return 'text-emerald-400';
        if (prob >= 50) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getProbabilityGradient = (prob: number) => {
        if (prob >= 75) return 'from-emerald-500 to-teal-500';
        if (prob >= 50) return 'from-amber-500 to-yellow-500';
        return 'from-rose-500 to-red-500';
    };

    return (
        <div className="glass-premium rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                        <span className="text-lg">🏛️</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">The Life Architect</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">AI-Driven Scenario Goal Optimizer</p>
                    </div>
                </div>
                {result && (
                    <div className="flex items-center gap-2">
                        {result.persona && (
                            <span className="text-[10px] px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold">
                                {result.persona}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Goal Selection */}
            {!customGoal ? (
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Choose Your North Star Goal</p>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {PRESET_GOALS.map((preset) => (
                            <button
                                key={preset.type}
                                onClick={() => handlePresetSelect(preset)}
                                className="group glass-card rounded-xl p-4 text-left hover:bg-white/5 transition-all border border-white/5 hover:border-indigo-500/30 hover:scale-[1.02]"
                            >
                                <span className="text-2xl block mb-2">{preset.icon}</span>
                                <span className="text-xs font-bold text-white block">{preset.label}</span>
                                <span className="text-[10px] text-gray-500 mt-1 block leading-relaxed">{preset.defaultDescription}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Goal Summary Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 glass-card rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{selectedPreset?.icon || '🎯'}</span>
                            <div>
                                <p className="text-sm font-bold text-white">{customGoal.description}</p>
                                <p className="text-[10px] text-gray-500">
                                    Target: {formatCurrency(customGoal.targetAmount)} in {customGoal.timeframeMonths} months
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Current Savings Rate</p>
                                <p className="text-sm font-bold text-white">{formatCurrency(result?.currentMonthlySavings || 0)}/mo</p>
                            </div>
                            <button
                                onClick={() => { setCustomGoal(null); setSelectedPreset(null); setActivePath(null); }}
                                className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-rose-500/30 transition-all"
                            >
                                Change Goal
                            </button>
                        </div>
                    </div>

                    {result && (
                        <>
                            {/* Probability Gauge */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="glass-card rounded-xl p-5 flex flex-col items-center justify-center">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">
                                        Success Probability
                                    </p>
                                    <div className="relative w-28 h-28">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                                            <circle
                                                cx="60" cy="60" r="50"
                                                stroke="url(#probGrad)"
                                                strokeWidth="10" fill="none"
                                                strokeDasharray={`${(result.monteCarlo.probabilityOfSuccess / 100) * 314} 314`}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000"
                                            />
                                            <defs>
                                                <linearGradient id="probGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor={result.monteCarlo.probabilityOfSuccess >= 75 ? '#10b981' : result.monteCarlo.probabilityOfSuccess >= 50 ? '#f59e0b' : '#f43f5e'} />
                                                    <stop offset="100%" stopColor={result.monteCarlo.probabilityOfSuccess >= 75 ? '#34d399' : result.monteCarlo.probabilityOfSuccess >= 50 ? '#fbbf24' : '#fb7185'} />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-2xl font-black tabular-nums ${getProbabilityColor(result.monteCarlo.probabilityOfSuccess)}`}>
                                                {result.monteCarlo.probabilityOfSuccess}%
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-gray-600 mt-2">{result.monteCarlo.simulations} simulations</p>
                                </div>

                                {/* Forecast Range */}
                                <div className="glass-card rounded-xl p-5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">Forecast Range</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Pessimistic (P10)</span>
                                            <span className="text-xs font-bold text-rose-400">{formatCurrency(result.monteCarlo.p10)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Median</span>
                                            <span className="text-xs font-bold text-white">{formatCurrency(result.monteCarlo.medianOutcome)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Optimistic (P90)</span>
                                            <span className="text-xs font-bold text-emerald-400">{formatCurrency(result.monteCarlo.p90)}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 font-bold">Target</span>
                                            <span className="text-xs font-bold text-indigo-400">{formatCurrency(customGoal.targetAmount)}</span>
                                        </div>
                                    </div>
                                    {/* Visual Range Bar */}
                                    <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden relative">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${getProbabilityGradient(result.monteCarlo.probabilityOfSuccess)} transition-all duration-700`}
                                            style={{ width: `${Math.min(100, (result.monteCarlo.medianOutcome / customGoal.targetAmount) * 100)}%` }}
                                        />
                                        {/* Target line */}
                                        <div className="absolute top-0 bottom-0 w-0.5 bg-indigo-400" style={{ left: '100%' }} />
                                    </div>
                                </div>

                                {/* Current Snapshot */}
                                <div className="glass-card rounded-xl p-5">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">Your Financial Snapshot</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Monthly Income</span>
                                            <span className="text-xs font-bold text-white">{formatCurrency(result.currentMonthlyIncome)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Monthly Expenses</span>
                                            <span className="text-xs font-bold text-gray-400">{formatCurrency(result.currentMonthlyExpenses)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">Net Savings</span>
                                            <span className={`text-xs font-bold ${result.currentMonthlySavings > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {formatCurrency(result.currentMonthlySavings)}
                                            </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 font-bold">Health Score</span>
                                            <span className="text-xs font-bold text-white">{result.currentHealthScore}/100</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Optimization Paths */}
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-4">Choose Your Optimized Path</p>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {result.paths.map((path) => {
                                        const colors = PATH_COLORS[path.type];
                                        const isActive = activePath === path.type;
                                        return (
                                            <button
                                                key={path.type}
                                                onClick={() => { setActivePath(path.type); setShowAdjustments(false); }}
                                                className={`group relative text-left glass-card rounded-xl p-5 border transition-all duration-300 hover:scale-[1.01]
                                                    ${isActive ? `${colors.border} ${colors.bg} shadow-lg ${colors.glow}` : 'border-white/5 hover:border-white/10'}`}
                                            >
                                                {/* Path Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-2xl">{path.icon}</span>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isActive ? colors.text : 'text-white'}`}>{path.label}</p>
                                                        <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{path.description}</p>
                                                    </div>
                                                </div>

                                                {/* Key Metrics */}
                                                <div className="space-y-3 mt-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-500">Probability</span>
                                                        <span className={`text-sm font-black tabular-nums ${getProbabilityColor(path.probability)}`}>
                                                            {path.probability}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full bg-gradient-to-r ${colors.gradient} transition-all duration-700`}
                                                            style={{ width: `${path.probability}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-500">Timeline</span>
                                                        <span className="text-xs font-bold text-white">
                                                            {path.timelineMonths < 12 ? `${path.timelineMonths}mo` :
                                                                `${(path.timelineMonths / 12).toFixed(1)}yr`}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-500">Monthly Target</span>
                                                        <span className="text-xs font-bold text-white">{formatCurrency(path.monthlySavingsRequired)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-500">Health Impact</span>
                                                        <span className="text-xs font-bold text-emerald-400">+{path.healthScoreImpact} pts</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-gray-500">Burnout Risk</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${BURNOUT_COLORS[path.burnoutRisk]}`}>
                                                            {path.burnoutRisk.toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Selected Path Details */}
                            {selectedPathData && (
                                <div className={`glass-card rounded-xl p-5 border ${PATH_COLORS[selectedPathData.type].border} animate-fade-in`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{selectedPathData.icon}</span>
                                            <p className={`text-sm font-bold ${PATH_COLORS[selectedPathData.type].text}`}>
                                                {selectedPathData.label} Path — Budget Adjustments
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowAdjustments(!showAdjustments)}
                                            className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
                                        >
                                            {showAdjustments ? 'Hide Details' : 'Show Details'}
                                        </button>
                                    </div>

                                    {showAdjustments && selectedPathData.categoryAdjustments.length > 0 && (
                                        <div className="space-y-2 mt-3">
                                            {selectedPathData.categoryAdjustments.map((adj, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-medium text-gray-300 w-28">{adj.category}</span>
                                                        <span className="text-[10px] text-gray-500">{formatCurrency(adj.currentMonthly)}/mo</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-gray-600">→</span>
                                                        <span className="text-xs font-bold text-white">{formatCurrency(adj.suggestedMonthly)}/mo</span>
                                                        <span className={`text-[10px] font-bold ${adj.changePercent < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {adj.changePercent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[10px] text-gray-500">Disposable income after plan</span>
                                                <span className={`text-xs font-bold ${selectedPathData.monthlyDisposableAfter > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {formatCurrency(Math.max(0, selectedPathData.monthlyDisposableAfter))}/mo
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {!showAdjustments && (
                                        <p className="text-[10px] text-gray-500 italic">
                                            Click "Show Details" to see exactly how each budget category would be adjusted for this path.
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LifeArchitectWidget;
