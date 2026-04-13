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
        if (rating === 'Excellent') return 'text-emerald-400 bg-emerald-500/10';
        if (rating === 'Very Good' || rating === 'Good') return 'text-blue-400 bg-blue-500/10';
        if (rating === 'Fair') return 'text-amber-400 bg-amber-500/10';
        return 'text-rose-400 bg-rose-500/10';
    };

    return (
        <div className="relative group overflow-hidden glass-premium rounded-2xl p-5 md:p-6 transition-all duration-500 hover:bg-slate-800/20">
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full blur-[100px] opacity-10 transition-opacity duration-700 ${getScoreGradient(healthScore.overallScore).includes('emerald') ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>

            <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110 ${getRatingColor(healthScore.creditScore.rating).split(' ')[1]}`}>
                            <HeartPulseIcon className={`w-6 h-6 ${getScoreColor(healthScore.overallScore)}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Financial Health</h2>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-4 py-1.5 rounded-full bg-white/5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                        {showDetails ? 'Hide Analysis' : 'Analyze Depth'}
                    </button>
                </div>

                {/* Overall Score Gauge - Redesigned for Premium Feel */}
                <div className="flex flex-col items-center justify-center py-4">
                    <div className="relative w-48 h-48 group/gauge">
                        {/* Outer Ring Shadow/Glow */}
                        <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-opacity duration-500 group-hover/gauge:opacity-40 bg-gradient-to-tr ${getScoreGradient(healthScore.overallScore)}`}></div>

                        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl">
                            {/* Track */}
                            <circle
                                cx="96"
                                cy="96"
                                r="84"
                                stroke="rgba(255,255,255,0.03)"
                                strokeWidth="14"
                                fill="none"
                            />
                            {/* Progress */}
                            <circle
                                cx="96"
                                cy="96"
                                r="84"
                                stroke="url(#healthScoreGradient)"
                                strokeWidth="14"
                                fill="none"
                                strokeDasharray={`${(healthScore.overallScore / 100) * 527.8} 527.8`}
                                strokeLinecap="round"
                                className="transition-all duration-[1500ms] ease-out shadow-inner"
                            />
                            <defs>
                                <linearGradient id="healthScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={healthScore.overallScore >= 80 ? '#10b981' : healthScore.overallScore >= 40 ? '#f59e0b' : '#f43f5e'} />
                                    <stop offset="100%" stopColor={healthScore.overallScore >= 80 ? '#34d399' : healthScore.overallScore >= 40 ? '#fbbf24' : '#fb7185'} />
                                </linearGradient>
                            </defs>
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="flex items-baseline">
                                <span className={`text-5xl font-black tracking-tighter ${getScoreColor(healthScore.overallScore)} tabular-nums leading-none`}>
                                    {healthScore.overallScore}
                                </span>
                                <span className="text-lg text-gray-500 font-bold ml-1">/100</span>
                            </div>
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mt-1">Health Index</span>
                        </div>
                    </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative overflow-hidden bg-slate-900/40 rounded-2xl p-4 border border-white/5 group/card transition-all hover:bg-slate-900/60">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover/card:bg-blue-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-blue-500/10">
                                <CreditCardIcon className="w-4 h-4 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Credit Profile</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-black text-white leading-none">{healthScore.creditScore.score}</span>
                            <div className={`inline-flex items-center mt-1`}>
                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${getRatingColor(healthScore.creditScore.rating)}`}>
                                    {healthScore.creditScore.rating}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-slate-900/40 rounded-2xl p-4 border border-white/5 group/card transition-all hover:bg-slate-900/60">
                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover/card:bg-emerald-500/20 transition-colors"></div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10">
                                <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Stability Plan</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white leading-none">{healthScore.emergencyFund.monthsCovered.toFixed(1)}</span>
                                <span className="text-xs text-gray-500 font-bold">m</span>
                            </div>
                            <div className="inline-flex items-center mt-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md ${getRatingColor(healthScore.emergencyFund.adequacy)}`}>
                                    {healthScore.emergencyFund.adequacy}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {showDetails && (
                    <div className="space-y-6 pt-6 border-t border-white/10 animate-fade-in">
                        {/* Credit Score Details */}
                        <div>
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Credit Evolution Factors</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                                        <span className="text-gray-400">Payment Consistency (35%)</span>
                                        <span className="text-white">{healthScore.creditScore.factors.paymentHistory}/100</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                            style={{ width: `${healthScore.creditScore.factors.paymentHistory}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1 px-1">
                                        <span className="text-gray-400">Debt Utilization (30%)</span>
                                        <span className="text-white">{healthScore.creditScore.factors.creditUtilization}/100</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden p-[1px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                                            style={{ width: `${healthScore.creditScore.factors.creditUtilization}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Retirement Strategy */}
                        <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Retirement Trajectory</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl">
                                    <span className="text-xs font-bold text-gray-400">Current Status</span>
                                    <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded-lg ${getRatingColor(healthScore.retirement.readiness)}`}>
                                        {healthScore.retirement.readiness}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Horizon</span>
                                        <span className="text-lg font-black text-white">{healthScore.retirement.yearsToRetirement} <span className="text-xs font-bold text-gray-500">Yrs</span></span>
                                    </div>
                                    <div className="bg-white/3 p-3 rounded-xl border border-white/5 text-center">
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Monthly</span>
                                        <span className="text-lg font-black text-white">{formatCurrency(healthScore.retirement.monthlyContribution)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Debt Sustainability */}
                        <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Debt Sustainability</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-400">DTI Ratio:</span>
                                    <span className={`text-xl font-black ${getScoreColor(100 - healthScore.debtHealth.debtToIncomeRatio)} tabular-nums`}>
                                        {healthScore.debtHealth.debtToIncomeRatio.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r ${getScoreGradient(100 - healthScore.debtHealth.debtToIncomeRatio)} transition-all duration-1000`}
                                        style={{ width: `${Math.min(healthScore.debtHealth.debtToIncomeRatio, 100)}%` }}></div>
                                </div>
                                <p className="text-[10px] font-medium text-gray-400 italic leading-relaxed bg-white/5 p-3 rounded-xl">
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
