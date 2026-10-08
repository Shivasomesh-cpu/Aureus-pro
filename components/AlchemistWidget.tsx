import React, { useState, useMemo, useCallback } from 'react';
import { Transaction, Budget, SavingsGoal, Debt, FinancialHealthScore, Category } from '../types';
import { simulateBudgetChanges, getAdjustableCategories, BudgetAdjustment, AlchemistSimulationResult } from '../services/alchemistService';
import { useSettings } from '../contexts/SettingsContext';

interface AlchemistWidgetProps {
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    debts: Debt[];
    healthScore: FinancialHealthScore | null;
}

const CATEGORY_COLORS: Record<string, string> = {
    Food: '#f59e0b',
    Shopping: '#a78bfa',
    Entertainment: '#f472b6',
    Travel: '#38bdf8',
    Transportation: '#60a5fa',
    Health: '#f87171',
    Education: '#34d399',
};

const AlchemistWidget: React.FC<AlchemistWidgetProps> = ({
    transactions, budgets, savingsGoals, debts, healthScore
}) => {
    const { currencySymbol, formatCurrency } = useSettings();
    const categories = useMemo(() => getAdjustableCategories(transactions), [transactions]);
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});

    const handleSliderChange = useCallback((category: Category, value: number) => {
        setAdjustments(prev => ({ ...prev, [category]: value }));
    }, []);

    const handleReset = useCallback(() => {
        setAdjustments({});
    }, []);

    const budgetAdjustments: BudgetAdjustment[] = useMemo(
        () => Object.entries(adjustments)
            .filter(([, v]) => v !== 0)
            .map(([category, adjustmentPercent]) => ({ category: category as Category, adjustmentPercent })),
        [adjustments]
    );

    const result: AlchemistSimulationResult = useMemo(
        () => simulateBudgetChanges(transactions, budgets, savingsGoals, debts, healthScore, budgetAdjustments),
        [transactions, budgets, savingsGoals, debts, healthScore, budgetAdjustments]
    );

    const hasAdjustments = budgetAdjustments.length > 0;

    const formatCurrencyDelta = (val: number) => {
        const abs = Math.abs(val);
        const sign = val < 0 ? '-' : val > 0 ? '+' : '';
        return `${sign}${currencySymbol}${abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="glass-premium rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                        <span className="text-lg">⚗️</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Aureus Alchemist</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">What-If Budget Simulator</p>
                    </div>
                </div>
                {hasAdjustments && (
                    <button
                        onClick={handleReset}
                        className="text-[10px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/30 transition-all"
                    >
                        Reset All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sliders Panel */}
                <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">Adjust Categories</p>
                    {categories.map(category => {
                        const value = adjustments[category] || 0;
                        const color = CATEGORY_COLORS[category] || '#94a3b8';
                        return (
                            <div key={category} className="group">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{category}</span>
                                    <span className={`text-xs font-bold tabular-nums ${value < 0 ? 'text-emerald-400' : value > 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                        {value > 0 ? '+' : ''}{value}%
                                    </span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="range"
                                        min={-50}
                                        max={50}
                                        step={5}
                                        value={value}
                                        onChange={(e) => handleSliderChange(category, parseInt(e.target.value))}
                                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(value + 50)}%, rgba(255,255,255,0.1) ${(value + 50)}%, rgba(255,255,255,0.1) 100%)`,
                                            accentColor: color
                                        }}
                                    />
                                    <div className="flex justify-between text-[8px] text-gray-600 mt-0.5">
                                        <span>-50%</span>
                                        <span className="text-gray-500">0</span>
                                        <span>+50%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Results Panel */}
                <div className="space-y-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">Predicted Outcome</p>

                    {/* Health Score */}
                    <div className="glass-card rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Health Score</span>
                            {hasAdjustments && (
                                <span className={`text-xs font-bold ${result.scoreDelta > 0 ? 'text-emerald-400' : result.scoreDelta < 0 ? 'text-rose-400' : 'text-gray-500'}`}>
                                    {result.scoreDelta > 0 ? '↑' : result.scoreDelta < 0 ? '↓' : '→'} {Math.abs(result.scoreDelta)} pts
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-black text-white tabular-nums leading-none">
                                {hasAdjustments ? result.predictedHealthScore : result.currentHealthScore}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">/100</span>
                            {hasAdjustments && (
                                <span className="text-sm text-gray-500 line-through ml-1">
                                    {result.currentHealthScore}
                                </span>
                            )}
                        </div>
                        {/* Score bar */}
                        <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: `${hasAdjustments ? result.predictedHealthScore : result.currentHealthScore}%`,
                                    background: `linear-gradient(90deg, ${(hasAdjustments ? result.predictedHealthScore : result.currentHealthScore) >= 70 ? '#10b981' :
                                        (hasAdjustments ? result.predictedHealthScore : result.currentHealthScore) >= 40 ? '#f59e0b' : '#ef4444'
                                        }, ${(hasAdjustments ? result.predictedHealthScore : result.currentHealthScore) >= 70 ? '#34d399' :
                                            (hasAdjustments ? result.predictedHealthScore : result.currentHealthScore) >= 40 ? '#fbbf24' : '#f87171'
                                        })`
                                }}
                            />
                        </div>
                    </div>

                    {/* Monthly Savings */}
                    <div className="glass-card rounded-xl p-4">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Monthly Savings</span>
                        <div className="flex items-end gap-3 mt-2">
                            <span className="text-2xl font-bold text-white tabular-nums">
                                {formatCurrency(hasAdjustments ? result.predictedMonthlySavings : result.currentMonthlySavings)}
                            </span>
                            {hasAdjustments && result.savingsDelta !== 0 && (
                                <span className={`text-sm font-semibold mb-0.5 ${result.savingsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatCurrencyDelta(result.savingsDelta)}/mo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Goal Impacts */}
                    {hasAdjustments && result.goalImpacts.length > 0 && (
                        <div className="glass-card rounded-xl p-4">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-3 block">Savings Goal Impact</span>
                            <div className="space-y-3">
                                {result.goalImpacts.map((goal, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: goal.color }} />
                                            <span className="text-xs text-gray-300">{goal.goalName}</span>
                                        </div>
                                        <span className={`text-xs font-bold ${goal.monthsSaved > 0 ? 'text-emerald-400' :
                                            goal.monthsSaved < 0 ? 'text-rose-400' : 'text-gray-500'
                                            }`}>
                                            {goal.monthsSaved > 0 ? `${goal.monthsSaved}mo faster` :
                                                goal.monthsSaved < 0 ? `${Math.abs(goal.monthsSaved)}mo slower` : 'No change'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlchemistWidget;
