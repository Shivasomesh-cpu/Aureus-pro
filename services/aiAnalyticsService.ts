import { Transaction, Budget, FinancialInsight, TransactionType } from "../types";

/**
 * Advanced AI Analytics Service for Financial Intelligence
 */

export const calculateSpendingPrediction = (transactions: Transaction[]): number => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const todayDate = now.getDate();

    const currentMonthExpenses = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === TransactionType.EXPENSE;
        })
        .reduce((sum, t) => sum + t.amount, 0);

    if (todayDate === 0) return 0;
    return (currentMonthExpenses / todayDate) * daysInMonth;
};

export const detectAnomalies = (transactions: Transaction[]): FinancialInsight[] => {
    const insights: FinancialInsight[] = [];
    const categories = Array.from(new Set(transactions.map(t => t.category)));

    categories.forEach(cat => {
        const catExpenses = transactions
            .filter(t => t.category === cat && t.type === TransactionType.EXPENSE)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first
        if (catExpenses.length < 5) return;

        const amounts = catExpenses.map(t => t.amount);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / amounts.length);

        const latest = catExpenses[0]; // Most recent transaction
        if (latest.amount > avg + 2 * stdDev) {
            insights.push({
                type: 'alert',
                message: `High spending detected in ${cat}: ${latest.amount.toFixed(2)} is significantly above your average of ${avg.toFixed(2)}.`,
                relatedCategory: cat
            });
        }
    });

    return insights;
};

/**
 * Monte Carlo Simulation for Future Wealth Forecast
 * Runs 1,000 simulations based on real monthly expense variance
 */
export const runMonteCarloSimulation = (balance: number, monthlyIncome: number, transactions: Transaction[], months: number = 6) => {
    const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenseTransactions.length < 5) return null;

    // Bucket expenses into calendar months to get realistic monthly totals
    const monthlyTotals = new Map<string, number>();
    expenseTransactions.forEach(t => {
        const key = t.date.slice(0, 7); // "YYYY-MM"
        monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + t.amount);
    });

    const monthlyValues = Array.from(monthlyTotals.values());
    if (monthlyValues.length < 1) return null;

    const avgMonthlyExpense = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
    const variance = monthlyValues.map(x => Math.pow(x - avgMonthlyExpense, 2)).reduce((a, b) => a + b, 0) / monthlyValues.length;
    const stdDev = Math.sqrt(variance);

    // Use a sensible volatility floor (15% of mean) so variance is always visible
    const effectiveStdDev = Math.max(stdDev, avgMonthlyExpense * 0.15);

    const iterations = 1000;
    const results: number[][] = [];

    for (let i = 0; i < iterations; i++) {
        let simBalance = balance;
        const path = [balance];
        for (let m = 0; m < months; m++) {
            // Box-Muller transform for normal distribution
            let u1 = Math.random(), u2 = Math.random();
            while (u1 === 0) u1 = Math.random();
            const rand = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

            const simulatedExpense = Math.max(0, avgMonthlyExpense + rand * effectiveStdDev);
            simBalance += (monthlyIncome - simulatedExpense);
            path.push(simBalance);
        }
        results.push(path);
    }

    // Aggregate percentile bands at each time point
    const timePoints = months + 1;
    const aggregated = [];
    for (let t = 0; t < timePoints; t++) {
        const values = results.map(r => r[t]).sort((a, b) => a - b);
        aggregated.push({
            month: t,
            p10: values[Math.floor(iterations * 0.1)],
            p50: values[Math.floor(iterations * 0.5)],
            p90: values[Math.floor(iterations * 0.9)],
        });
    }

    return aggregated;
};

/**
 * Advanced Financial Health Scoring for Radar Chart
 */
export const calculateHealthScores = (transactions: Transaction[], budgets: Budget[]) => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    // 1. Stability (Consistency of spending vs income)
    // Higher income coverage = higher stability
    const coverageRatio = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    const stabilityScore = Math.min(100, Math.max(0, (coverageRatio + 0.2) * 100)); // Baseline 20% savings = 40 score + base

    // 2. Savings Efficiency
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    const savingsScore = Math.min(100, Math.max(0, savingsRate * 300)); // 33% savings = 100 score

    // 3. Discretionary Control (budget adherence)
    let adherenceScore = 100;
    budgets.forEach(b => {
        const spent = expenses.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
        if (spent > b.amount) {
            const overagePercent = (spent - b.amount) / b.amount;
            adherenceScore -= (overagePercent * 20); // Deduct for overspending
        }
    });
    const controlScore = Math.min(100, Math.max(0, adherenceScore));

    // 4. Essential Efficiency (Needs vs Wants - approximated by Housing/Food/Transport vs Other)
    const essentials = expenses.filter(t => ['Housing', 'Utilities', 'Food', 'Transportation', 'Healthcare'].includes(t.category))
        .reduce((s, t) => s + t.amount, 0);
    const essentialRatio = totalExpense > 0 ? essentials / totalExpense : 1;
    const efficiencyScore = Math.min(100, Math.max(0, essentialRatio * 120)); // Targeted at 80% essentials is efficient? (Debatable logic, adjusting to 50-70% is "balanced")

    // 5. Growth Potential (Income diversity/growth - simplified here to just positive cash flow trend)
    const growthScore = totalIncome > totalExpense ? 85 : 40;

    return [
        { subject: 'Stability', A: Math.round(stabilityScore), B: 75, fullMark: 100 },
        { subject: 'Savings', A: Math.round(savingsScore), B: 60, fullMark: 100 },
        { subject: 'Control', A: Math.round(controlScore), B: 80, fullMark: 100 },
        { subject: 'Efficiency', A: Math.round(efficiencyScore), B: 70, fullMark: 100 },
        { subject: 'Growth', A: Math.round(growthScore), B: 65, fullMark: 100 },
    ];
};

export const generateAnalysisNarrative = (scores: any[]) => {
    const lowest = scores.reduce((min, p) => p.A < min.A ? p : min, scores[0]);
    const highest = scores.reduce((max, p) => p.A > max.A ? p : max, scores[0]);

    return `Your financial profile shows exceptional strength in ${highest.subject} (Score: ${highest.A}), indicating strong management in this area. However, your ${lowest.subject} score (${lowest.A}) suggests room for improvement. Focusing on ${lowest.subject === 'Control' ? 'sticking to category limits' : lowest.subject === 'Savings' ? 'increasing your monthly surplus' : 'optimizing essential costs'} could significantly boost your overall financial health score.`;
};

export const getBudgetOptimization = (budgets: Budget[], transactions: Transaction[]) => {
    return budgets.map(b => {
        const spent = transactions
            .filter(t => t.category === b.category && t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0);

        if (spent < b.amount * 0.7) {
            return {
                category: b.category,
                current: b.amount,
                suggested: Math.round(b.amount * 0.8),
                reason: "Consistently under budget."
            };
        }
        return null;
    }).filter(Boolean);
};
