import {
    Transaction,
    TransactionType,
    Subscription,
    SubscriptionStatus
} from '../types';

/**
 * Subscription Audit Service
 * 
 * Deep analysis of subscriptions to detect dormant/underused services,
 * calculate usage scores, and generate optimization actions.
 */

export type AuditStatus = 'active' | 'dormant' | 'at_risk';
export type OptimizationAction = 'keep' | 'cancel' | 'downgrade';

export interface AuditedSubscription {
    id: string;
    name: string;
    monthlyAmount: number;
    annualProjection: number;
    status: AuditStatus;
    usageScore: number; // 0-100
    daysSinceLastUse: number;
    transactionCount: number;
    recommendedAction: OptimizationAction;
    actionReason: string;
    category: string;
    frequency: string;
}

export interface SubscriptionAuditResult {
    subscriptions: AuditedSubscription[];
    totalMonthlySpend: number;
    totalAnnualSpend: number;
    potentialMonthlySavings: number;
    potentialAnnualSavings: number;
    dormantCount: number;
    atRiskCount: number;
    activeCount: number;
    healthImpact: number; // Estimated health score points gained if dormant subs cancelled
}

/**
 * Calculate usage score for a subscription based on transaction patterns
 */
function calculateUsageScore(
    sub: Subscription,
    transactions: Transaction[]
): { score: number; daysSinceLastUse: number; txnCount: number } {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Find related transactions (by description matching)
    const relatedTxns = transactions.filter(t => {
        const desc = t.description.toLowerCase();
        const subName = sub.name.toLowerCase().split(' ')[0]; // First word match
        return desc.includes(subName) && new Date(t.date) >= ninetyDaysAgo;
    });

    const txnCount = relatedTxns.length;

    // Days since last use
    let daysSinceLastUse = 999;
    if (sub.lastUsed) {
        daysSinceLastUse = Math.ceil((now.getTime() - new Date(sub.lastUsed).getTime()) / (1000 * 60 * 60 * 24));
    }
    if (relatedTxns.length > 0) {
        const lastTxnDate = relatedTxns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        const daysSinceTxn = Math.ceil((now.getTime() - new Date(lastTxnDate.date).getTime()) / (1000 * 60 * 60 * 24));
        daysSinceLastUse = Math.min(daysSinceLastUse, daysSinceTxn);
    }

    // Calculate score based on recency and frequency
    let score = 100;

    // Recency factor (0-50 points)
    if (daysSinceLastUse > 90) score -= 50;
    else if (daysSinceLastUse > 60) score -= 35;
    else if (daysSinceLastUse > 30) score -= 15;
    else score -= Math.max(0, (daysSinceLastUse / 30) * 10);

    // Frequency factor (0-50 points) — monthly sub should have 3 txns in 90 days
    const expectedTxns = sub.frequency === 'monthly' ? 3 : sub.frequency === 'weekly' ? 12 : 1;
    const frequencyRatio = Math.min(1, txnCount / expectedTxns);
    score -= Math.round((1 - frequencyRatio) * 50);

    return {
        score: Math.max(0, Math.min(100, Math.round(score))),
        daysSinceLastUse,
        txnCount
    };
}

/**
 * Determine audit status from usage score
 */
function getAuditStatus(usageScore: number, daysSinceLastUse: number): AuditStatus {
    if (usageScore < 30 || daysSinceLastUse > 60) return 'dormant';
    if (usageScore < 60 || daysSinceLastUse > 30) return 'at_risk';
    return 'active';
}

/**
 * Generate optimization recommendation
 */
function getOptimizationAction(
    status: AuditStatus,
    usageScore: number,
    monthlyAmount: number
): { action: OptimizationAction; reason: string } {
    if (status === 'dormant') {
        return {
            action: 'cancel',
            reason: `No meaningful usage detected. Cancel to save ${monthlyAmount.toFixed(2)}/month (${(monthlyAmount * 12).toFixed(2)}/year).`
        };
    }

    if (status === 'at_risk') {
        if (usageScore < 45) {
            return {
                action: 'downgrade',
                reason: `Usage is low. Consider downgrading to a cheaper plan or evaluating if you still need this service.`
            };
        }
        return {
            action: 'keep',
            reason: `Usage is moderate. Monitor over the next month to see if usage increases.`
        };
    }

    return {
        action: 'keep',
        reason: `Actively used subscription. Good value for the cost.`
    };
}

/**
 * Main audit function — analyze all subscriptions
 */
export function auditSubscriptions(
    subscriptions: Subscription[],
    transactions: Transaction[]
): SubscriptionAuditResult {
    const auditedSubs: AuditedSubscription[] = subscriptions.map(sub => {
        const { score, daysSinceLastUse, txnCount } = calculateUsageScore(sub, transactions);
        const status = sub.status === SubscriptionStatus.CANCELLED
            ? 'dormant' as AuditStatus
            : getAuditStatus(score, daysSinceLastUse);

        const monthlyAmount = sub.frequency === 'yearly'
            ? sub.amount / 12
            : sub.frequency === 'weekly'
                ? sub.amount * 4.33
                : sub.amount;

        const { action, reason } = getOptimizationAction(status, score, monthlyAmount);

        return {
            id: sub.id,
            name: sub.name,
            monthlyAmount: Math.round(monthlyAmount * 100) / 100,
            annualProjection: Math.round(monthlyAmount * 12 * 100) / 100,
            status,
            usageScore: score,
            daysSinceLastUse,
            transactionCount: txnCount,
            recommendedAction: action,
            actionReason: reason,
            category: sub.category,
            frequency: sub.frequency
        };
    });

    // Sort: dormant first, then at_risk, then active
    const statusOrder: Record<AuditStatus, number> = { dormant: 0, at_risk: 1, active: 2 };
    auditedSubs.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const totalMonthlySpend = auditedSubs.reduce((sum, s) => sum + s.monthlyAmount, 0);
    const dormantSubs = auditedSubs.filter(s => s.status === 'dormant');
    const atRiskSubs = auditedSubs.filter(s => s.status === 'at_risk');
    const activeSubs = auditedSubs.filter(s => s.status === 'active');
    const potentialMonthlySavings = dormantSubs.reduce((sum, s) => sum + s.monthlyAmount, 0);

    // Estimate health score impact (savings rate improvement)
    const incomeTotal = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
    const dates = transactions.map(t => new Date(t.date).getTime());
    const monthSpan = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30));
    const monthlyIncome = incomeTotal / monthSpan;
    const savingsRateImprovement = monthlyIncome > 0 ? (potentialMonthlySavings / monthlyIncome) * 100 : 0;
    const healthImpact = Math.round(savingsRateImprovement * 1.5);

    return {
        subscriptions: auditedSubs,
        totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
        totalAnnualSpend: Math.round(totalMonthlySpend * 12 * 100) / 100,
        potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
        potentialAnnualSavings: Math.round(potentialMonthlySavings * 12 * 100) / 100,
        dormantCount: dormantSubs.length,
        atRiskCount: atRiskSubs.length,
        activeCount: activeSubs.length,
        healthImpact
    };
}
