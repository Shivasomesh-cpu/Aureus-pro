import React, { useState } from 'react';
import { ProactiveHealthOptimization, HealthOptimizationAction, EarlyWarning } from '../types';
import { HeartPulseIcon, ShieldCheckIcon, ExclamationTriangleIcon, LightBulbIcon, ArrowTrendingUpIcon, TrendingDownIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface HealthOptimizationWidgetProps {
    optimization: ProactiveHealthOptimization | null;
    onToggleAction?: (actionId: string) => void;
}

const HealthOptimizationWidget: React.FC<HealthOptimizationWidgetProps> = ({ optimization, onToggleAction }) => {
    const { formatCurrency } = useSettings();
    const [showAllActions, setShowAllActions] = useState(false);

    if (!optimization) {
        return (
            <div className="glass-card p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/15 rounded-xl border border-rose-500/20">
                        <HeartPulseIcon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Proactive Health Optimization</h3>
                        <p className="text-xs text-gray-500">Needs more data to predict health trajectory.</p>
                    </div>
                </div>
            </div>
        );
    }

    const getRiskColors = (risk: string) => {
        switch (risk) {
            case 'low': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', gradient: 'from-emerald-500 to-emerald-400' };
            case 'moderate': return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', gradient: 'from-blue-500 to-blue-400' };
            case 'elevated': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', gradient: 'from-amber-500 to-amber-400' };
            case 'high': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', gradient: 'from-orange-500 to-orange-400' };
            case 'critical': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', gradient: 'from-rose-500 to-rose-400' };
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', gradient: 'from-gray-500 to-gray-400' };
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', icon: '🔴' };
            case 'warning': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: '🟡' };
            default: return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: '🔵' };
        }
    };

    const getEffortBadge = (effort: string) => {
        switch (effort) {
            case 'easy': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' };
            case 'moderate': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' };
            case 'hard': return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' };
            default: return { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' };
        }
    };

    const riskStyle = getRiskColors(optimization.riskLevel);
    const displayActions = showAllActions ? optimization.actions : optimization.actions.slice(0, 3);

    return (
        <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-8 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/15 rounded-xl border border-rose-500/20">
                        <HeartPulseIcon className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Proactive Health Optimization</h3>
                        <p className="text-[10px] text-gray-500">
                            {optimization.earlyWarnings.length} warnings • {optimization.actions.length} actions
                        </p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}>
                    {optimization.riskLevel} risk
                </div>
            </div>

            {/* Score & Trajectory */}
            <div className="bg-slate-800/40 border border-white/5 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Health Score Trajectory</span>
                    <div className="flex items-center gap-1.5">
                        {optimization.scoreChangeFromLastMonth >= 0
                            ? <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-emerald-400" />
                            : <TrendingDownIcon className="w-3.5 h-3.5 text-rose-400" />
                        }
                        <span className={`text-xs font-bold ${optimization.scoreChangeFromLastMonth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {optimization.scoreChangeFromLastMonth > 0 ? '+' : ''}{optimization.scoreChangeFromLastMonth} pts
                        </span>
                    </div>
                </div>

                {/* Trajectory Visualization */}
                <div className="flex items-end justify-between gap-2 h-20 px-1">
                    {optimization.trajectory.map((point, idx) => {
                        const height = `${Math.max(10, point.predictedScore)}%`;
                        const isFirst = idx === 0;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-white">{point.predictedScore}</span>
                                <div className="w-full relative">
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-500 ${isFirst ? 'bg-gradient-to-t from-white/20 to-white/10' :
                                            point.predictedScore >= optimization.currentScore
                                                ? 'bg-gradient-to-t from-emerald-500/40 to-emerald-500/20'
                                                : 'bg-gradient-to-t from-rose-500/40 to-rose-500/20'
                                            }`}
                                        style={{ height }}
                                    />
                                </div>
                                <span className="text-[9px] text-gray-500">
                                    {point.daysAhead === 0 ? 'Now' : `+${point.daysAhead}d`}
                                </span>
                                <span className="text-[8px] text-gray-600">
                                    {point.confidence}% conf
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Early Warnings */}
            {optimization.earlyWarnings.length > 0 && (
                <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Early Warnings</span>
                    {optimization.earlyWarnings.map((warning, idx) => {
                        const style = getSeverityStyles(warning.severity);
                        return (
                            <div key={idx} className={`${style.bg} border ${style.border} p-3 rounded-xl flex items-start gap-3`}>
                                <span className="text-sm mt-0.5">{style.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                                            {warning.metric.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {warning.trendDirection === 'worsening' && <TrendingDownIcon className="w-3 h-3 text-rose-400" />}
                                            {warning.trendDirection === 'improving' && <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-400" />}
                                            <span className={`text-[10px] ${warning.trendDirection === 'worsening' ? 'text-rose-400' :
                                                warning.trendDirection === 'improving' ? 'text-emerald-400' : 'text-gray-500'
                                                }`}>{warning.trendDirection}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed">{warning.message}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Optimization Actions */}
            <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Optimization Actions</span>
                {displayActions.map((action, idx) => {
                    const effortStyle = getEffortBadge(action.effort);
                    return (
                        <div key={idx} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    {onToggleAction && (
                                        <button
                                            onClick={() => onToggleAction(action.id)}
                                            className={`w-4 h-4 rounded border mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${action.isCompleted
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-gray-600 hover:border-gray-400'
                                                }`}
                                        >
                                            {action.isCompleted && (
                                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium ${action.isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                                            {action.title}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{action.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                    +{action.estimatedImpact} pts
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${effortStyle.bg} ${effortStyle.text} border ${effortStyle.border}`}>
                                    {action.effort}
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700/50 text-gray-400 border border-white/5">
                                    {action.timeframe}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Show More */}
            {optimization.actions.length > 3 && (
                <button
                    onClick={() => setShowAllActions(!showAllActions)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium w-full text-center py-1"
                >
                    {showAllActions ? 'Show Less' : `Show ${optimization.actions.length - 3} More Actions`}
                </button>
            )}
        </div>
    );
};

export default HealthOptimizationWidget;
