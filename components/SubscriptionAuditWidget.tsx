import React, { useMemo } from 'react';
import { Transaction, Subscription, RecurringTransaction, TransactionType } from '../types';
import { auditSubscriptions, SubscriptionAuditResult, AuditedSubscription, AuditStatus } from '../services/subscriptionAuditService';

interface SubscriptionAuditWidgetProps {
    subscriptions: Subscription[];
    transactions: Transaction[];
    recurringTransactions: RecurringTransaction[];
}

const STATUS_CONFIG: Record<AuditStatus, { label: string; color: string; bg: string; border: string }> = {
    dormant: { label: 'Dormant', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    at_risk: { label: 'At Risk', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
    active: { label: 'Active', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
};

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    cancel: { label: 'Cancel', color: '#ef4444', icon: '✕' },
    downgrade: { label: 'Downgrade', color: '#f59e0b', icon: '↓' },
    keep: { label: 'Keep', color: '#10b981', icon: '✓' },
};

const SubscriptionAuditWidget: React.FC<SubscriptionAuditWidgetProps> = ({
    subscriptions, transactions, recurringTransactions
}) => {
    // Merge recurring expenses into subscriptions list for a comprehensive audit
    const mergedSubscriptions = useMemo(() => {
        const existingNames = new Set(subscriptions.map(s => s.name.toLowerCase()));
        const recurringAsSubs: Subscription[] = recurringTransactions
            .filter(r => r.isActive && r.type === TransactionType.EXPENSE && !existingNames.has(r.description.toLowerCase()))
            .map(r => ({
                id: `rec-${r.id}`,
                name: r.description,
                amount: r.amount,
                frequency: r.frequency as 'weekly' | 'monthly' | 'yearly',
                category: r.category,
                nextBillingDate: r.nextDueDate,
                lastUsed: r.nextDueDate,
                status: 'active' as any,
                autoDetected: true,
                relatedTransactionIds: []
            }));
        return [...subscriptions, ...recurringAsSubs];
    }, [subscriptions, recurringTransactions]);
    const audit: SubscriptionAuditResult = useMemo(
        () => auditSubscriptions(mergedSubscriptions, transactions),
        [mergedSubscriptions, transactions]
    );

    if (audit.subscriptions.length === 0) {
        return (
            <div className="glass-premium rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20 flex items-center justify-center">
                        <span className="text-lg">🔍</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Subscription Audit</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">No subscriptions detected</p>
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center py-6">
                    No subscriptions found. Add recurring payments to enable the audit.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-premium rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/20 flex items-center justify-center">
                        <span className="text-lg">🔍</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Subscription Audit</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Identify dormant & optimize costs</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wider block">Monthly</span>
                    <span className="text-lg font-black text-white tabular-nums">
                        {audit.totalMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[8px] text-emerald-500/70 uppercase tracking-wider block">Active</span>
                    <span className="text-lg font-black text-emerald-400 tabular-nums">{audit.activeCount}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[8px] text-amber-500/70 uppercase tracking-wider block">At Risk</span>
                    <span className="text-lg font-black text-amber-400 tabular-nums">{audit.atRiskCount}</span>
                </div>
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[8px] text-rose-500/70 uppercase tracking-wider block">Dormant</span>
                    <span className="text-lg font-black text-rose-400 tabular-nums">{audit.dormantCount}</span>
                </div>
            </div>

            {/* Potential Savings Banner */}
            {audit.potentialMonthlySavings > 0 && (
                <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Potential Savings</span>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-xl font-black text-emerald-400 tabular-nums">
                                    {audit.potentialMonthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-emerald-500/70">/month</span>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-sm font-bold text-emerald-400/70 tabular-nums">
                                    {audit.potentialAnnualSavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-emerald-500/70">/year</span>
                            </div>
                        </div>
                        {audit.healthImpact > 0 && (
                            <div className="text-right">
                                <span className="text-[9px] text-gray-500 block">Health Impact</span>
                                <span className="text-sm font-bold text-emerald-400">+{audit.healthImpact} pts</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Subscription List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {audit.subscriptions.map((sub) => (
                    <SubscriptionCard key={sub.id} sub={sub} />
                ))}
            </div>
        </div>
    );
};

const SubscriptionCard: React.FC<{ sub: AuditedSubscription }> = ({ sub }) => {
    const statusCfg = STATUS_CONFIG[sub.status];
    const actionCfg = ACTION_CONFIG[sub.recommendedAction];

    return (
        <div className="glass-card rounded-xl p-3 hover:border-white/10 transition-all group">
            <div className="flex items-center gap-3">
                {/* Status dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-breathe" style={{ background: statusCfg.color }} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">{sub.name}</span>
                        <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
                            style={{ color: statusCfg.color, background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
                        >
                            {statusCfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-500">{sub.category}</span>
                        <span className="text-[10px] text-gray-600">•</span>
                        <span className="text-[10px] text-gray-500">{sub.daysSinceLastUse < 999 ? `${sub.daysSinceLastUse}d ago` : 'Never used'}</span>
                    </div>
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-white tabular-nums">
                        {sub.monthlyAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[9px] text-gray-600">/month</div>
                </div>

                {/* Action Badge */}
                <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    style={{
                        color: actionCfg.color,
                        background: `${actionCfg.color}15`,
                        border: `1px solid ${actionCfg.color}30`
                    }}
                >
                    <span>{actionCfg.icon}</span>
                    <span>{actionCfg.label}</span>
                </div>
            </div>

            {/* Usage Score Bar */}
            <div className="mt-2 flex items-center gap-2">
                <span className="text-[8px] text-gray-600 w-12">Usage</span>
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${sub.usageScore}%`,
                            background: sub.usageScore >= 60 ? '#10b981' :
                                sub.usageScore >= 30 ? '#f59e0b' : '#ef4444'
                        }}
                    />
                </div>
                <span className="text-[9px] font-bold tabular-nums text-gray-400 w-6 text-right">{sub.usageScore}</span>
            </div>

            {/* Action Reason (on hover) */}
            <div className="mt-1 max-h-0 overflow-hidden group-hover:max-h-12 transition-all duration-300 ease-out">
                <p className="text-[9px] text-gray-500 leading-relaxed pt-1">{sub.actionReason}</p>
            </div>
        </div>
    );
};

export default SubscriptionAuditWidget;
