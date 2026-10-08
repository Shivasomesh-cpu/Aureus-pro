import React, { useState } from 'react';
import { Transaction, Budget, SavingsGoal, Debt, Subscription, RecurringTransaction, FinancialHealthScore, BehavioralProfile, AutonomousBudgetTuning, ProactiveHealthOptimization, BudgetTuningRecommendation } from '../types';
import DeepAnalysisWidget from './DeepAnalysisWidget';
import BudgetTuningWidget from './BudgetTuningWidget';
import HealthOptimizationWidget from './HealthOptimizationWidget';
import LifeArchitectWidget from './LifeArchitectWidget';
import WealthMomentumWidget from './WealthMomentumWidget';
import SubscriptionAuditWidget from './SubscriptionAuditWidget';
import AlchemistWidget from './AlchemistWidget';
import { SparklesIcon, BrainIcon } from './icons';

interface AIIntelligencePageProps {
    behavioralProfile: BehavioralProfile | null;
    budgetTuning: AutonomousBudgetTuning | null;
    healthOptimization: ProactiveHealthOptimization | null;
    transactions: Transaction[];
    budgets: Budget[];
    savingsGoals: SavingsGoal[];
    debts: Debt[];
    subscriptions: Subscription[];
    recurringTransactions: RecurringTransaction[];
    healthScore: FinancialHealthScore | null;
    onApplyTuning: (recommendations: BudgetTuningRecommendation[]) => void;
    onToggleAction: (actionId: string) => void;
}

type TabType = 'all' | 'alchemist' | 'deep' | 'architect' | 'momentum' | 'tuning';

const AIIntelligencePage: React.FC<AIIntelligencePageProps> = ({
    behavioralProfile,
    budgetTuning,
    healthOptimization,
    transactions,
    budgets,
    savingsGoals,
    debts,
    subscriptions,
    recurringTransactions,
    healthScore,
    onApplyTuning,
    onToggleAction
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const completedActionsCount = healthOptimization?.actions.filter(a => a.isCompleted).length || 0;
    const totalActionsCount = healthOptimization?.actions.length || 0;

    return (
        <div className="animate-fade-in-up space-y-10">

            {/* Page Header with High-Tech Ambient Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-violet-500/30 rounded-2xl blur-lg animate-pulse-glow"></div>
                        <div className="relative p-3.5 bg-gradient-to-br from-violet-600/30 via-purple-600/20 to-cyan-500/20 rounded-2xl border border-violet-500/30 shadow-lg shadow-violet-500/10">
                            <SparklesIcon className="w-8 h-8 text-violet-400" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Aureus Intelligence Suite</h1>
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                                Autonomous v2.4
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Multi-model behavioral heuristics, real-time what-if simulation, and predictive wealth architecture</p>
                    </div>
                </div>

                {/* KPI Quick-Badge Bar */}
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/8 backdrop-blur-md">
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Health Score</p>
                        <p className="text-sm font-bold text-white tabular-nums flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            {healthScore ? `${healthScore.score}/100` : '—'}
                        </p>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/8 backdrop-blur-md">
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Archetype</p>
                        <p className="text-sm font-bold text-amber-300 truncate max-w-[120px] mt-0.5">
                            {behavioralProfile?.archetype || 'Balanced'}
                        </p>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-white/8 backdrop-blur-md">
                        <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Active Actions</p>
                        <p className="text-sm font-bold text-cyan-300 tabular-nums mt-0.5">
                            {completedActionsCount}/{totalActionsCount} Done
                        </p>
                    </div>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/5 custom-scrollbar">
                {[
                    { id: 'all', label: 'All Engines' },
                    { id: 'alchemist', label: '⚗️ What-If Alchemist' },
                    { id: 'deep', label: '🧠 Behavioral & Health' },
                    { id: 'architect', label: '🎯 10-Yr Life Architect' },
                    { id: 'momentum', label: '⚡ Momentum & Subscriptions' },
                    { id: 'tuning', label: '🤖 Autonomous Tuner' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-violet-500/20 to-amber-500/20 text-white border border-white/20 shadow-md shadow-violet-500/10'
                                : 'bg-white/[0.03] text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] border border-white/5'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Section 1: Aureus Alchemist (What-If Simulator) */}
            {(activeTab === 'all' || activeTab === 'alchemist') && (
                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-breathe"></span>
                            Aureus Alchemist — Real-Time What-If Budget Simulator
                        </h2>
                        <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full">
                            Interactive Dynamic Engine
                        </span>
                    </div>
                    <AlchemistWidget
                        transactions={transactions}
                        budgets={budgets}
                        savingsGoals={savingsGoals}
                        debts={debts}
                        healthScore={healthScore}
                    />
                </section>
            )}

            {/* Section 2: Deep Analysis + Health Optimization */}
            {(activeTab === 'all' || activeTab === 'deep') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <section className="flex flex-col h-full space-y-3">
                        <h2 className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-breathe"></span>
                            Deep Behavioral Analysis Engine
                        </h2>
                        <div className="flex-1">
                            <DeepAnalysisWidget profile={behavioralProfile} />
                        </div>
                    </section>

                    <section className="flex flex-col h-full space-y-3">
                        <h2 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-breathe"></span>
                            Proactive Health Optimization
                        </h2>
                        <div className="flex-1">
                            <HealthOptimizationWidget optimization={healthOptimization} onToggleAction={onToggleAction} />
                        </div>
                    </section>
                </div>
            )}

            {/* Section 3: The Life Architect */}
            {(activeTab === 'all' || activeTab === 'architect') && (
                <section className="space-y-3">
                    <h2 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-breathe"></span>
                        The Life Architect — 10-Year Monte Carlo & Goal Simulator
                    </h2>
                    <LifeArchitectWidget
                        transactions={transactions}
                        budgets={budgets}
                        savingsGoals={savingsGoals}
                        debts={debts}
                        healthScore={healthScore}
                        behavioralProfile={behavioralProfile}
                    />
                </section>
            )}

            {/* Section 4: Wealth Momentum Heatmap + Interactive Subscription Audit */}
            {(activeTab === 'all' || activeTab === 'momentum') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <section className="flex flex-col h-full space-y-3">
                        <h2 className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-breathe"></span>
                            Wealth Momentum Heatmap
                        </h2>
                        <div className="flex-1">
                            <WealthMomentumWidget
                                transactions={transactions}
                                behavioralProfile={behavioralProfile}
                            />
                        </div>
                    </section>

                    <section className="flex flex-col h-full space-y-3">
                        <h2 className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-breathe"></span>
                            Interactive Subscription Audit & Zombie Detector
                        </h2>
                        <div className="flex-1">
                            <SubscriptionAuditWidget
                                subscriptions={subscriptions}
                                transactions={transactions}
                                recurringTransactions={recurringTransactions}
                            />
                        </div>
                    </section>
                </div>
            )}

            {/* Section 5: Autonomous Budget Tuning */}
            {(activeTab === 'all' || activeTab === 'tuning') && (
                <section className="space-y-3">
                    <h2 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.3em] px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-breathe"></span>
                        Autonomous Budget Tuning & Category Allocation
                    </h2>
                    <BudgetTuningWidget tuning={budgetTuning} onApplyTuning={onApplyTuning} />
                </section>
            )}
        </div>
    );
};

export default AIIntelligencePage;
