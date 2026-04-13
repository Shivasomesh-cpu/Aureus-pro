import React from 'react';
import { BehavioralProfile } from '../types';
import { SparklesIcon, ArrowTrendingUpIcon, TrendingDownIcon, ClockIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface DeepAnalysisWidgetProps {
    profile: BehavioralProfile | null;
}

const DeepAnalysisWidget: React.FC<DeepAnalysisWidgetProps> = ({ profile }) => {
    const { formatCurrency } = useSettings();

    if (!profile) {
        return (
            <div className="glass-card p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-violet-500/15 rounded-xl border border-violet-500/20">
                        <SparklesIcon className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Deep Analysis Engine</h3>
                        <p className="text-xs text-gray-500">Needs more transaction data to build your behavioral profile.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-violet-500/5 rounded-lg border border-violet-500/10">
                    <ClockIcon className="w-4 h-4 text-violet-400/60" />
                    <p className="text-[10px] text-gray-400">Processing begins with 5+ transactions. Optimal with 90+ days of history.</p>
                </div>
            </div>
        );
    }

    const trendIcon = profile.spendingVelocity.trend === 'accelerating'
        ? <ArrowTrendingUpIcon className="w-4 h-4 text-rose-400" />
        : profile.spendingVelocity.trend === 'decelerating'
            ? <TrendingDownIcon className="w-4 h-4 text-emerald-400" />
            : <div className="w-4 h-0.5 bg-gray-500 rounded-full" />;

    const trendColor = profile.spendingVelocity.trend === 'accelerating'
        ? 'text-rose-400'
        : profile.spendingVelocity.trend === 'decelerating'
            ? 'text-emerald-400'
            : 'text-gray-400';

    const riskColors = {
        conservative: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        moderate: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        aggressive: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' }
    };

    const riskStyle = riskColors[profile.riskLevel];

    return (
        <div className="glass-card p-8 rounded-2xl border border-white/5 space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/15 rounded-xl border border-violet-500/20">
                        <SparklesIcon className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white">Deep Analysis Engine</h3>
                        <p className="text-[10px] text-gray-500">{profile.dataSpanDays} days of data • {profile.transactionCount} transactions</p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${riskStyle.bg} ${riskStyle.text} ${riskStyle.border} border`}>
                    {profile.riskLevel}
                </div>
            </div>

            {/* Spending Velocity */}
            <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Spending Velocity</span>
                    <div className="flex items-center gap-1">
                        {trendIcon}
                        <span className={`text-[10px] font-bold ${trendColor}`}>
                            {profile.spendingVelocity.trend === 'stable' ? 'Stable' :
                                `${profile.spendingVelocity.trendPercentage > 0 ? '+' : ''}${profile.spendingVelocity.trendPercentage}%`}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-1">
                    <div className="text-center overflow-hidden">
                        <p className="text-xs font-bold text-white truncate" title={formatCurrency(profile.spendingVelocity.dailyBurnRate)}>{formatCurrency(profile.spendingVelocity.dailyBurnRate)}</p>
                        <p className="text-[9px] text-gray-500">Daily</p>
                    </div>
                    <div className="text-center border-x border-white/5 overflow-hidden px-1">
                        <p className="text-xs font-bold text-white truncate" title={formatCurrency(profile.spendingVelocity.weeklyAverage)}>{formatCurrency(profile.spendingVelocity.weeklyAverage)}</p>
                        <p className="text-[9px] text-gray-500">Weekly</p>
                    </div>
                    <div className="text-center overflow-hidden">
                        <p className="text-xs font-bold text-white truncate" title={formatCurrency(profile.spendingVelocity.monthlyAverage)}>{formatCurrency(profile.spendingVelocity.monthlyAverage)}</p>
                        <p className="text-[9px] text-gray-500">Monthly</p>
                    </div>
                </div>
            </div>

            {/* Category Affinity - Top 4 */}
            <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Category DNA</span>
                <div className="mt-2 space-y-2">
                    {profile.categoryAffinities.slice(0, 4).map((aff, idx) => (
                        <div key={idx}>
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] text-gray-300 font-medium">{aff.category}</span>
                                <span className="text-[10px] font-bold text-white">{aff.percentageOfTotal}%</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-700"
                                    style={{
                                        width: `${aff.percentageOfTotal}%`,
                                        background: `linear-gradient(90deg, ${idx === 0 ? '#8b5cf6, #a78bfa' :
                                            idx === 1 ? '#6366f1, #818cf8' :
                                                idx === 2 ? '#3b82f6, #60a5fa' :
                                                    '#06b6d4, #22d3ee'
                                            })`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Impulse vs Planned + Temporal */}
            <div className="grid grid-cols-2 gap-2">
                {/* Impulse Ratio */}
                <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Impulse Ratio</span>
                    <div className="mt-2 flex items-center justify-center">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <circle
                                    cx="40" cy="40" r="32" fill="none"
                                    stroke={profile.impulseVsPlannedRatio > 0.5 ? '#f43f5e' : '#10b981'}
                                    strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray={`${profile.impulseVsPlannedRatio * 201} 201`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{Math.round(profile.impulseVsPlannedRatio * 100)}%</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-500 text-center mt-1">
                        {profile.impulseTransactionCount} imp / {profile.plannedTransactionCount} plan
                    </p>
                </div>

                {/* Temporal Patterns */}
                <div className="bg-slate-800/40 border border-white/5 p-3 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rhythm</span>
                    <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500">Peak Day</span>
                            <span className="text-[11px] font-bold text-violet-400">{profile.temporalPatterns.peakSpendingDay}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500">Peak Week</span>
                            <span className="text-[11px] font-bold text-violet-400">Week {profile.temporalPatterns.peakSpendingWeek}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500">Risk</span>
                            <span className={`text-[11px] font-bold ${riskStyle.text}`}>{profile.riskToleranceScore}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-500">Consistency</span>
                            <span className="text-[11px] font-bold text-blue-400">{profile.savingsConsistency}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Insights */}
            {profile.topInsights && profile.topInsights.length > 0 && (
                <div className="flex-1 bg-slate-800/40 border border-white/5 p-4 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Key Insights</span>
                    <div className="mt-2 space-y-2">
                        {profile.topInsights.slice(0, 4).map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                                <span className="text-violet-400 text-[10px] mt-0.5 flex-shrink-0">•</span>
                                <p className="text-[11px] text-gray-300 leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepAnalysisWidget;
