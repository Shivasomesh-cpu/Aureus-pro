import React, { useState } from 'react';
import { FinancialHealthScore } from '../types';
import { HeartPulseIcon, ShieldCheckIcon, BanknotesIcon, CreditCardIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface FinancialHealthWidgetProps {
    healthScore: FinancialHealthScore | null;
}

const FinancialHealthWidget: React.FC<FinancialHealthWidgetProps> = ({ healthScore }) => {
    const { formatCurrency } = useSettings();
    const [showDetails, setShowDetails] = useState(false);

    if (!healthScore) {
        return (
            <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <HeartPulseIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Financial Health</h2>
                        <p className="text-sm text-gray-400">Add transactions to calculate</p>
                    </div>
                </div>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-400';
        if (score >= 60) return 'text-blue-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-emerald-500 to-green-500';
        if (score >= 60) return 'from-blue-500 to-cyan-500';
        if (score >= 40) return 'from-amber-500 to-yellow-500';
        return 'from-rose-500 to-red-500';
    };

    const getRatingColor = (rating: string) => {
        if (rating === 'Not set') return 'text-slate-500 bg-slate-100';
        if (rating === 'Excellent') return 'text-emerald-400 bg-emerald-500/10';
        if (rating === 'Very Good' || rating === 'Good') return 'text-blue-400 bg-blue-500/10';
        if (rating === 'Fair') return 'text-amber-400 bg-amber-500/10';
        return 'text-rose-400 bg-rose-500/10';
    };

    return (
        <div className="relative group overflow-hidden glass-premium rounded-2xl p-5 md:p-6 transition-all duration-300 bg-white border border-slate-200/80 shadow-xs">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full blur-[100px] opacity-10 transition-opacity duration-700 ${getScoreGradient(healthScore.overallScore).includes('emerald') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-105">
                            <HeartPulseIcon className={`w-6 h-6 ${getScoreColor(healthScore.overallScore)}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Financial Health</h2>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-all border border-slate-200/60"
                    >
                        {showDetails ? 'Hide Analysis' : 'Analyze Depth'}
                    </button>
                </div>

                {/* Overall Score Gauge - Redesigned for Premium Feel */}
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="relative w-44 h-44 group/gauge">
                        {/* Outer Ring Shadow/Glow */}
                        <div className={`absolute inset-0 rounded-full blur-xl opacity-20 transition-opacity duration-500 group-hover/gauge:opacity-30 bg-gradient-to-tr ${getScoreGradient(healthScore.overallScore)}`}></div>

                        <svg className="w-full h-full transform -rotate-90 filter">
                            {/* Track */}
                            <circle
                                cx="88"
                                cy="88"
                                r="76"
                                stroke="#e2e8f0"
                                strokeWidth="12"
                                fill="none"
                            />
                            {/* Progress */}
                            <circle
                                cx="88"
                                cy="88"
                                r="76"
                                stroke="url(#healthScoreGradient)"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={`${(healthScore.overallScore / 100) * 477.5} 477.5`}
                                strokeLinecap="round"
                                className="transition-all duration-[1500ms] ease-out"
                            />
                            <defs>
                                <linearGradient id="healthScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={healthScore.overallScore >= 80 ? '#10b981' : healthScore.overallScore >= 40 ? '#f59e0b' : '#f43f5e'} />
                                    <stop offset="100%" stopColor={healthScore.overallScore >= 80 ? '#059669' : healthScore.overallScore >= 40 ? '#d97706' : '#e11d48'} />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline">
                                <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(healthScore.overallScore)} tabular-nums leading-none`}>
                                    {healthScore.overallScore}
                                </span>
                                <span className="text-base text-slate-400 font-bold ml-1">/100</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Money Index</span>
                        </div>
                    </div>
                </div>

                <p className="-mt-4 text-center text-[11px] leading-5 text-slate-500">An informational index based on emergency savings, debt payments, and your retirement plan.</p>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="relative overflow-hidden bg-slate-50 rounded-2xl p-4 border border-slate-200/70 group/card transition-all hover:bg-slate-100/70">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-100">
                                <CreditCardIcon className="w-4 h-4 text-blue-700" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Debt payment ratio</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl font-black text-slate-900 leading-none">{healthScore.debtHealth.monthlyIncome > 0 ? `${healthScore.debtHealth.debtToIncomeRatio.toFixed(1)}%` : '—'}</span>
                            <div className="inline-flex items-center mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${getRatingColor(healthScore.debtHealth.rating)}`}>
                                    {healthScore.debtHealth.monthlyIncome > 0 ? healthScore.debtHealth.rating : 'Add income data'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-slate-50 rounded-2xl p-4 border border-slate-200/70 group/card transition-all hover:bg-slate-100/70">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-emerald-100">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-700" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stability Plan</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900 leading-none">{healthScore.emergencyFund.monthsCovered.toFixed(1)}</span>
                                <span className="text-xs text-slate-500 font-bold">m</span>
                            </div>
                            <div className="inline-flex items-center mt-1">
                                <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${getRatingColor(healthScore.emergencyFund.adequacy)}`}>
                                    {healthScore.emergencyFund.adequacy}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {showDetails && (
                    <div className="space-y-5 pt-5 border-t border-slate-100 animate-fade-in">
                        {/* Retirement Strategy */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Retirement Trajectory</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-200/60">
                                    <span className="text-xs font-semibold text-slate-600">Current Status</span>
                                    <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${getRatingColor(healthScore.retirement.readiness)}`}>
                                        {healthScore.retirement.readiness}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-center">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Horizon</span>
                                        <span className="text-lg font-black text-slate-900">{healthScore.retirement.readiness === 'Not set' ? '—' : <>{healthScore.retirement.yearsToRetirement} <span className="text-xs font-bold text-slate-400">Yrs</span></>}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-center">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monthly</span>
                                        <span className="text-lg font-black text-slate-900">{healthScore.retirement.readiness === 'Not set' ? '—' : formatCurrency(healthScore.retirement.monthlyContribution)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Debt Sustainability */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Debt Sustainability</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-600">DTI Ratio:</span>
                                    <span className={`text-xl font-bold ${getScoreColor(100 - healthScore.debtHealth.debtToIncomeRatio)} tabular-nums`}>
                                        {healthScore.debtHealth.debtToIncomeRatio.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r ${getScoreGradient(100 - healthScore.debtHealth.debtToIncomeRatio)} transition-all duration-1000`}
                                        style={{ width: `${Math.min(healthScore.debtHealth.debtToIncomeRatio, 100)}%` }}></div>
                                </div>
                                <p className="text-[11px] font-medium text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200/60">
                                    "{healthScore.debtHealth.recommendation}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialHealthWidget;
