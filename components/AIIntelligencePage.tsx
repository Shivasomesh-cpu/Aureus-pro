import React from 'react';
import { Transaction, Budget, SavingsGoal, Debt, Subscription, RecurringTransaction, FinancialHealthScore, BehavioralProfile, AutonomousBudgetTuning, ProactiveHealthOptimization, BudgetTuningRecommendation } from '../types';
import DeepAnalysisWidget from './DeepAnalysisWidget';
import BudgetTuningWidget from './BudgetTuningWidget';
import HealthOptimizationWidget from './HealthOptimizationWidget';
import LifeArchitectWidget from './LifeArchitectWidget';
import WealthMomentumWidget from './WealthMomentumWidget';
import SubscriptionAuditWidget from './SubscriptionAuditWidget';
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
    return (
        <div className="animate-fade-in-up space-y-16">

            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-2xl border border-violet-500/20">
                    <SparklesIcon className="w-7 h-7 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Aureus Intelligence</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Deep behavioral analysis, autonomous budget tuning, and proactive health optimization</p>
                </div>
            </div>

            {/* Row 1: Deep Analysis (left) + Health Optimization (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                <section className="flex flex-col h-full">
                    <h2 className="text-[10px] font-bold text-violet-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-breathe"></span>
                        Deep Analysis Engine
                    </h2>
                    <div className="flex-1">
                        <DeepAnalysisWidget profile={behavioralProfile} />
                    </div>
                </section>

                <section className="flex flex-col h-full">
                    <h2 className="text-[10px] font-bold text-rose-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50 animate-breathe"></span>
                        Proactive Health Optimization
                    </h2>
                    <div className="flex-1">
                        <HealthOptimizationWidget optimization={healthOptimization} onToggleAction={onToggleAction} />
                    </div>
                </section>
            </div>

            {/* Row 2: The Life Architect (full width) */}
            <section>
                <h2 className="text-[10px] font-bold text-indigo-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-breathe"></span>
                    The Life Architect — AI Goal Optimizer
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

            {/* Row 3: Wealth Momentum (left) + Subscription Audit (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                <section className="flex flex-col h-full">
                    <h2 className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-breathe"></span>
                        Wealth Momentum Heatmap
                    </h2>
                    <div className="flex-1">
                        <WealthMomentumWidget
                            transactions={transactions}
                            behavioralProfile={behavioralProfile}
                        />
                    </div>
                </section>

                <section className="flex flex-col h-full">
                    <h2 className="text-[10px] font-bold text-pink-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500/50 animate-breathe"></span>
                        Interactive Subscription Audit
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

            {/* Row 4: Budget Tuning (full width) */}
            <section>
                <h2 className="text-[10px] font-bold text-cyan-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50 animate-breathe"></span>
                    Autonomous Budget Tuning
                </h2>
                <BudgetTuningWidget tuning={budgetTuning} onApplyTuning={onApplyTuning} />
            </section>
        </div>
    );
};

export default AIIntelligencePage;
