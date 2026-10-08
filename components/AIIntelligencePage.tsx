import React, { useState, useEffect } from 'react';
import { Transaction, Budget, SavingsGoal, Debt, Subscription, RecurringTransaction, FinancialHealthScore, BehavioralProfile, AutonomousBudgetTuning, ProactiveHealthOptimization, BudgetTuningRecommendation } from '../types';
import DeepAnalysisWidget from './DeepAnalysisWidget';
import BudgetTuningWidget from './BudgetTuningWidget';
import HealthOptimizationWidget from './HealthOptimizationWidget';
import LifeArchitectWidget from './LifeArchitectWidget';
import WealthMomentumWidget from './WealthMomentumWidget';
import SubscriptionAuditWidget from './SubscriptionAuditWidget';
import AlchemistWidget from './AlchemistWidget';
import AICouncilWidget from './AICouncilWidget';
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
    initialTab?: string;
    onOpenStatementUpload?: () => void;
}

export type AITabType = 'all' | 'council' | 'alchemist' | 'deep' | 'architect' | 'momentum' | 'tuning';

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
    onToggleAction,
    initialTab = 'all',
    onOpenStatementUpload,
}) => {
    const [activeTab, setActiveTab] = useState<AITabType>((initialTab as AITabType) || 'all');

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab as AITabType);
        }
    }, [initialTab]);

    const completedActionsCount = healthOptimization?.actions.filter(a => a.isCompleted).length || 0;
    const totalActionsCount = healthOptimization?.actions.length || 0;

    const displayScore = healthScore?.overallScore;

    if (transactions.length === 0) {
        return (
            <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><SparklesIcon className="h-6 w-6" /></div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Insights need your numbers</h1>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Add a few transactions or import a statement to see spending patterns and scenario tools based on your own data. Aureus won’t invent a financial profile for you.</p>
                {onOpenStatementUpload && <button onClick={onOpenStatementUpload} className="mt-5 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Import a statement</button>}
            </section>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-8">

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Aureus Intelligence Suite</h1>
                                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                                Planning tools
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">Scenario exploration and spending insights based on the information you enter</p>
                    </div>
                </div>

                {/* KPI Quick-Badge Bar */}
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                    <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Health Score</p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums flex items-center gap-1.5 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {displayScore === undefined ? 'Not available' : `${displayScore}/100`}
                        </p>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Archetype</p>
                        <p className="text-sm font-bold text-amber-600 truncate max-w-[120px] mt-0.5">
                            {behavioralProfile?.archetype || 'Add transactions'}
                        </p>
                    </div>
                    <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Active Actions</p>
                        <p className="text-sm font-bold text-indigo-600 tabular-nums mt-0.5">
                            {completedActionsCount}/{totalActionsCount} Done
                        </p>
                    </div>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200/60 custom-scrollbar">
                {[
                    { id: 'all', label: 'All Engines' },
                    { id: 'council', label: '🏛️ Advisory Council' },
                    { id: 'alchemist', label: '⚗️ What-If Alchemist' },
                    { id: 'deep', label: '🧠 Behavioral & Health' },
                    { id: 'architect', label: '🎯 10-Yr Life Architect' },
                    { id: 'momentum', label: '⚡ Momentum & Subscriptions' },
                    { id: 'tuning', label: '🤖 Autonomous Tuner' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as AITabType)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-slate-100/70 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Section: The Aureus Advisory Council (Multi-Agent Panel) */}
            {(activeTab === 'all' || activeTab === 'council') && (
                <section className="space-y-3">
                    <AICouncilWidget
                        transactions={transactions}
                        budgets={budgets}
                        debts={debts}
                        savingsGoals={savingsGoals}
                        healthScore={healthScore}
                    />
                </section>
            )}

            {/* Section: Aureus Alchemist (What-If Simulator) */}
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


            {/* Section: Deep Analysis + Health Optimization */}
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

            {/* Section: The Life Architect */}
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

            {/* Section: Wealth Momentum Heatmap + Interactive Subscription Audit */}
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

            {/* Section: Autonomous Budget Tuning */}
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
