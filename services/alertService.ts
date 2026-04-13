import { Alert, AlertType, AlertPriority, Transaction, RecurringTransaction, Subscription, SubscriptionStatus, Debt } from '../types';

/**
 * Alert Service - Smart Alerts & Automation
 * 
 * Features:
 * - Bill payment reminders (3 days before due)
 * - Subscription audit (identify unused subscriptions)
 * - Price drop alerts for recurring purchases
 */

/**
 * Generate bill payment reminders for recurring transactions
 */
export function generateBillReminders(
    recurringTransactions: RecurringTransaction[],
    existingAlerts: Alert[]
): Alert[] {
    const newAlerts: Alert[] = [];
    const today = new Date();

    for (const recurring of recurringTransactions) {
        if (!recurring.isActive) continue;

        const dueDate = new Date(recurring.nextDueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Alert 3 days before due date
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
            // Check if alert already exists
            const alertExists = existingAlerts.some(
                a => a.type === AlertType.BILL_REMINDER &&
                    a.relatedId === recurring.id &&
                    !a.dismissed
            );

            if (!alertExists) {
                newAlerts.push({
                    id: crypto.randomUUID(),
                    type: AlertType.BILL_REMINDER,
                    priority: daysUntilDue === 0 ? AlertPriority.HIGH :
                        daysUntilDue === 1 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
                    title: `Bill Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
                    message: `${recurring.description} payment of ${recurring.amount.toFixed(2)} is due on ${dueDate.toLocaleDateString()}`,
                    createdAt: today.toISOString(),
                    dueDate: recurring.nextDueDate,
                    relatedId: recurring.id,
                    dismissed: false,
                });
            }
        }
    }

    return newAlerts;
}

/**
 * Detect subscriptions from transactions
 */
export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
    const subscriptionKeywords = [
        'netflix', 'spotify', 'disney', 'hbo', 'prime', 'youtube',
        'hulu', 'apple music', 'gym', 'fitness', 'membership',
        'subscription', 'monthly', 'premium', 'pro'
    ];

    const potentialSubscriptions = new Map<string, Transaction[]>();

    // Group similar transactions
    for (const transaction of transactions) {
        const desc = transaction.description.toLowerCase();
        const isSubscription = subscriptionKeywords.some(keyword => desc.includes(keyword));

        if (isSubscription) {
            const key = transaction.description.split('-')[0].trim(); // Use first part as key
            if (!potentialSubscriptions.has(key)) {
                potentialSubscriptions.set(key, []);
            }
            potentialSubscriptions.get(key)!.push(transaction);
        }
    }

    const subscriptions: Subscription[] = [];

    // Convert to subscriptions if they appear regularly
    for (const [name, txns] of potentialSubscriptions.entries()) {
        if (txns.length >= 2) { // At least 2 occurrences
            const sortedTxns = txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestTxn = sortedTxns[0];
            const avgAmount = txns.reduce((sum, t) => sum + t.amount, 0) / txns.length;

            // Calculate next billing date (assume monthly)
            const lastDate = new Date(latestTxn.date);
            const nextBilling = new Date(lastDate);
            nextBilling.setMonth(nextBilling.getMonth() + 1);

            // Check if unused (no transaction in last 60 days)
            const daysSinceLastUse = Math.ceil((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            const status = daysSinceLastUse > 60 ? SubscriptionStatus.UNUSED : SubscriptionStatus.ACTIVE;

            subscriptions.push({
                id: crypto.randomUUID(),
                name: name,
                amount: parseFloat(avgAmount.toFixed(2)),
                frequency: 'monthly',
                category: latestTxn.category,
                nextBillingDate: nextBilling.toISOString().split('T')[0],
                lastUsed: latestTxn.date,
                status: status,
                autoDetected: true,
                relatedTransactionIds: txns.map(t => t.id),
            });
        }
    }

    return subscriptions;
}

/**
 * Generate subscription audit alerts
 */
export function generateSubscriptionAuditAlerts(
    subscriptions: Subscription[],
    existingAlerts: Alert[]
): Alert[] {
    const newAlerts: Alert[] = [];

    const unusedSubscriptions = subscriptions.filter(s => s.status === SubscriptionStatus.UNUSED);

    for (const sub of unusedSubscriptions) {
        // Check if alert already exists
        const alertExists = existingAlerts.some(
            a => a.type === AlertType.SUBSCRIPTION_UNUSED &&
                a.relatedId === sub.id &&
                !a.dismissed
        );

        if (!alertExists) {
            const daysSinceUse = sub.lastUsed
                ? Math.ceil((new Date().getTime() - new Date(sub.lastUsed).getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            newAlerts.push({
                id: crypto.randomUUID(),
                type: AlertType.SUBSCRIPTION_UNUSED,
                priority: AlertPriority.MEDIUM,
                title: 'Unused Subscription Detected',
                message: `${sub.name} hasn't been used in ${daysSinceUse} days. Consider canceling to save ${sub.amount.toFixed(2)}/month.`,
                createdAt: new Date().toISOString(),
                relatedId: sub.id,
                dismissed: false,
            });
        }
    }

    // Total subscription cost alert
    const totalMonthlyCost = subscriptions
        .filter(s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.UNUSED)
        .reduce((sum, s) => sum + (s.frequency === 'monthly' ? s.amount : s.amount / 12), 0);

    if (totalMonthlyCost > 100) { // Threshold
        const costAlertExists = existingAlerts.some(
            a => a.type === AlertType.SUBSCRIPTION_UNUSED &&
                a.title.includes('Total Subscription Cost') &&
                !a.dismissed
        );

        if (!costAlertExists) {
            newAlerts.push({
                id: crypto.randomUUID(),
                type: AlertType.SUBSCRIPTION_UNUSED,
                priority: AlertPriority.LOW,
                title: 'Total Subscription Cost',
                message: `You're spending ${totalMonthlyCost.toFixed(2)}/month on ${subscriptions.length} subscriptions. Review to optimize costs.`,
                createdAt: new Date().toISOString(),
                dismissed: false,
            });
        }
    }

    return newAlerts;
}

/**
 * Detect price drops for recurring purchases
 */
export function generatePriceDropAlerts(
    transactions: Transaction[],
    existingAlerts: Alert[]
): Alert[] {
    const newAlerts: Alert[] = [];

    // Group transactions by description
    const transactionGroups = new Map<string, Transaction[]>();

    for (const txn of transactions) {
        const key = txn.description.split('-')[0].trim();
        if (!transactionGroups.has(key)) {
            transactionGroups.set(key, []);
        }
        transactionGroups.get(key)!.push(txn);
    }

    // Check for price drops
    for (const [desc, txns] of transactionGroups.entries()) {
        if (txns.length >= 3) { // Need at least 3 purchases to detect pattern
            const sortedTxns = txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const latestTxn = sortedTxns[0];
            const previousTxns = sortedTxns.slice(1, 4); // Last 3 previous purchases

            const avgPreviousPrice = previousTxns.reduce((sum, t) => sum + t.amount, 0) / previousTxns.length;
            const priceDrop = ((avgPreviousPrice - latestTxn.amount) / avgPreviousPrice) * 100;

            if (priceDrop > 10) { // 10% or more price drop
                const alertExists = existingAlerts.some(
                    a => a.type === AlertType.PRICE_DROP &&
                        a.relatedId === latestTxn.id &&
                        !a.dismissed
                );

                if (!alertExists) {
                    newAlerts.push({
                        id: crypto.randomUUID(),
                        type: AlertType.PRICE_DROP,
                        priority: AlertPriority.LOW,
                        title: 'Price Drop Detected',
                        message: `${desc} is now ${priceDrop.toFixed(0)}% cheaper! Was ${avgPreviousPrice.toFixed(2)}, now ${latestTxn.amount.toFixed(2)}.`,
                        createdAt: new Date().toISOString(),
                        relatedId: latestTxn.id,
                        dismissed: false,
                    });
                }
            }
        }
    }

    return newAlerts;
}

/**
 * Generate debt payment due alerts
 */
export function generateDebtPaymentAlerts(
    debts: Debt[],
    existingAlerts: Alert[]
): Alert[] {
    const newAlerts: Alert[] = [];
    const today = new Date();
    const currentDay = today.getDate();

    for (const debt of debts) {
        const daysUntilDue = debt.dueDate - currentDay;
        const adjustedDaysUntilDue = daysUntilDue < 0 ? daysUntilDue + 30 : daysUntilDue;

        // Alert 3 days before due date
        if (adjustedDaysUntilDue <= 3 && adjustedDaysUntilDue >= 0) {
            const alertExists = existingAlerts.some(
                a => a.type === AlertType.DEBT_PAYMENT_DUE &&
                    a.relatedId === debt.id &&
                    !a.dismissed
            );

            if (!alertExists) {
                newAlerts.push({
                    id: crypto.randomUUID(),
                    type: AlertType.DEBT_PAYMENT_DUE,
                    priority: adjustedDaysUntilDue === 0 ? AlertPriority.HIGH : AlertPriority.MEDIUM,
                    title: `Debt Payment Due ${adjustedDaysUntilDue === 0 ? 'Today' : `in ${adjustedDaysUntilDue} day${adjustedDaysUntilDue > 1 ? 's' : ''}`}`,
                    message: `${debt.name} minimum payment of ${debt.minimumPayment.toFixed(2)} is due on day ${debt.dueDate} of this month.`,
                    createdAt: today.toISOString(),
                    relatedId: debt.id,
                    dismissed: false,
                });
            }
        }
    }

    return newAlerts;
}

/**
 * Main function to generate all alerts
 */
export function generateAllAlerts(
    transactions: Transaction[],
    recurringTransactions: RecurringTransaction[],
    subscriptions: Subscription[],
    debts: Debt[],
    existingAlerts: Alert[]
): Alert[] {
    const billReminders = generateBillReminders(recurringTransactions, existingAlerts);
    const subscriptionAlerts = generateSubscriptionAuditAlerts(subscriptions, existingAlerts);
    const priceDropAlerts = generatePriceDropAlerts(transactions, existingAlerts);
    const debtAlerts = generateDebtPaymentAlerts(debts, existingAlerts);

    return [...billReminders, ...subscriptionAlerts, ...priceDropAlerts, ...debtAlerts];
}

/**
 * Dismiss an alert
 */
export function dismissAlert(alerts: Alert[], alertId: string): Alert[] {
    return alerts.map(alert =>
        alert.id === alertId ? { ...alert, dismissed: true } : alert
    );
}

/**
 * Snooze an alert until a specific date
 */
export function snoozeAlert(alerts: Alert[], alertId: string, snoozeDays: number): Alert[] {
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);

    return alerts.map(alert =>
        alert.id === alertId ? { ...alert, snoozedUntil: snoozeUntil.toISOString() } : alert
    );
}

/**
 * Get active alerts (not dismissed and not snoozed)
 */
export function getActiveAlerts(alerts: Alert[]): Alert[] {
    const now = new Date();
    return alerts.filter(alert =>
        !alert.dismissed &&
        (!alert.snoozedUntil || new Date(alert.snoozedUntil) <= now)
    );
}
