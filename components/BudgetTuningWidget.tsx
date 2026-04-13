import React, { useState } from 'react';
import { AutonomousBudgetTuning, BudgetTuningRecommendation } from '../types';
import { ChartBarIcon, ArrowTrendingUpIcon, TrendingDownIcon, LightBulbIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface BudgetTuningWidgetProps {
    tuning: AutonomousBudgetTuning | null;
    onApplyTuning?: (recommendations: BudgetTuningRecommendation[]) => void;
}

const BudgetTuningWidget: React.FC<BudgetTuningWidgetProps> = ({ tuning, onApplyTuning }) => {
    const { formatCurrency } = useSettings();
    const [showAll, setShowAll] = useState(false);

    if (!tuning) {
        return (
            <div className="glass-card p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/20">
                        <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Autonomous Budget Tuning</h3>
                        <p className="text-xs text-gray-500">Needs more data to generate tuning recommendations.</p>
                    </div>
                </div>
            </div>
        );
    }

    const actionableRecs = tuning.recommendations.filter(r => r.type !== 'maintain');
    const allRecs = actionableRecs.length > 0 ? actionableRecs : tuning.recommendations;
    const displayRecs = showAll ? allRecs : allRecs.slice(0, 4);
    const hasMore = allRecs.length > 4;

    const getTypeColors = (type: string) => {
        switch (type) {
            case 'decrease': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Decrease' };
            case 'increase': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Increase' };
            case 'new': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'New Budget' };
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: 'Maintain' };
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-emerald-400';
        if (confidence >= 60) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/20">
                        <ChartBarIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Autonomous Budget Tuning</h3>
                        <p className="text-[10px] text-gray-500">
                            {actionableRecs.length} recommendations • {tuning.seasonalContext}
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Efficiency</p>
                    <p className={`text-xl font-bold ${tuning.overallEfficiency >= 70 ? 'text-emerald-400' :
                        tuning.overallEfficiency >= 40 ? 'text-amber-400' : 'text-rose-400'
                        }`}>{tuning.overallEfficiency}%</p>
                </div>
                <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Savings Potential</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(tuning.totalSavingsPotential)}</p>
                </div>
                <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Season</p>
                    <p className="text-sm font-bold text-cyan-400 mt-1">{tuning.seasonalContext}</p>
                </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2.5">
                {displayRecs.map((rec, idx) => {
                    const typeStyle = getTypeColors(rec.type);
                    return (
                        <div key={idx} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white">{rec.category}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`}>
                                        {typeStyle.label}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityBadge(rec.priority)}`}>
                                        {rec.priority}
                                    </span>
                                </div>
                                <span className={`text-xs font-bold ${getConfidenceColor(rec.confidence)}`}>
                                    {rec.confidence}% conf
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3 leading-relaxed">{rec.reason}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {rec.currentBudget > 0 && (
                                        <span className="text-xs text-gray-500 line-through">{formatCurrency(rec.currentBudget)}</span>
                                    )}
                                    <span className="text-sm font-bold text-white">{formatCurrency(rec.suggestedBudget)}</span>
                                </div>
                                {rec.changeAmount !== 0 && (
                                    <div className="flex items-center gap-1">
                                        {rec.changeAmount < 0
                                            ? <TrendingDownIcon className="w-3.5 h-3.5 text-emerald-400" />
                                            : <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-amber-400" />
                                        }
                                        <span className={`text-xs font-bold ${rec.changeAmount < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {rec.changeAmount > 0 ? '+' : ''}{rec.changePercentage}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show More / Apply Actions */}
            <div className="flex items-center justify-between pt-2">
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                    >
                        {showAll ? 'Show Less' : `Show ${actionableRecs.length - 4} More`}
                    </button>
                )}
                {onApplyTuning && actionableRecs.length > 0 && (
                    <button
                        onClick={() => onApplyTuning(actionableRecs)}
                        className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-bold rounded-lg border border-cyan-500/20 transition-all hover:scale-105"
                    >
                        Apply All Tuning
                    </button>
                )}
                {actionableRecs.length === 0 && (
                    <span className="text-[10px] text-emerald-400 font-medium">✓ All budgets are well-calibrated</span>
                )}
            </div>
        </div>
    );
};

export default BudgetTuningWidget;
