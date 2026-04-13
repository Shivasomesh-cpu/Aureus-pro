import {
    Transaction,
    TransactionType,
    Budget,
    Debt,
    SavingsGoal,
    Category,
    FinancialHealthScore,
    ProactiveHealthOptimization,
    HealthTrajectoryPoint,
    EarlyWarning,
    HealthOptimizationAction
} from '../types';

/**
 * Proactive Health Optimizer
 * 
 * Predictive engine that extends the existing health scoring system
 * with trajectory prediction, early warning detection, and actionable
 * optimization recommendations with impact scoring.
 */

// ============================================
// HEALTH TRAJECTORY PREDICTION
// ============================================

const predictHealthTrajectory = (
    transactions: Transaction[],
    currentScore: number,
    debts: Debt[]
): HealthTrajectoryPoint[] => {
    // Calculate monthly health score changes from transaction trends
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

    // Monthly spending trend (simple linear regression)
    const monthlyExpenses = new Map<string, number>();
    expenses.forEach(t => {
        const month = t.date.slice(0, 7);
        monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + t.amount);
    });

    const months = Array.from(monthlyExpenses.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    let monthlyTrend = 0; // spending change per month

    if (months.length >= 2) {
        const n = months.length;
        const xMean = (n - 1) / 2;
        const yMean = months.reduce((sum, m) => sum + m[1], 0) / n;

        let numerator = 0;
        let denominator = 0;
        months.forEach((m, i) => {
            numerator += (i - xMean) * (m[1] - yMean);
            denominator += Math.pow(i - xMean, 2);
        });

        monthlyTrend = denominator > 0 ? numerator / denominator : 0;
    }

    // Debt reduction impact
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const monthlyDebtPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const debtReductionRate = totalDebt > 0 ? monthlyDebtPayment / totalDebt : 0;

    // Predict scores at 30, 60, 90 days
    const trajectory: HealthTrajectoryPoint[] = [
        { daysAhead: 0, predictedScore: currentScore, confidence: 100 }
    ];

    [30, 60, 90].forEach(days => {
        const monthsAhead = days / 30;

        // Positive factors: savings, debt reduction
        let scoreChange = 0;
        scoreChange += savingsRate > 0.15 ? monthsAhead * 2 : savingsRate > 0 ? monthsAhead * 0.5 : monthsAhead * -2;
        scoreChange += debtReductionRate * monthsAhead * 10;

        // Negative factors: spending acceleration
        if (monthlyTrend > 0) {
            const avgMonthlySpend = totalExpense / Math.max(1, months.length);
            const spendingAcceleration = avgMonthlySpend > 0 ? monthlyTrend / avgMonthlySpend : 0;
            scoreChange -= spendingAcceleration * monthsAhead * 15;
        }

        const predicted = Math.max(0, Math.min(100, Math.round(currentScore + scoreChange)));
        const confidence = Math.max(30, Math.round(90 - (days * 0.4))); // Confidence decreases with time

        trajectory.push({ daysAhead: days, predictedScore: predicted, confidence });
    });

    return trajectory;
};

// ============================================
// EARLY WARNING SYSTEM
// ============================================

const generateEarlyWarnings = (
    transactions: Transaction[],
    debts: Debt[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[]
): EarlyWarning[] => {
    const warnings: EarlyWarning[] = [];
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    // 1. Debt-to-Income Ratio Warning
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const monthlyIncome = totalIncome / Math.max(1, getMonthSpan(transactions));
    const monthlyDebtPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const dtiRatio = monthlyIncome > 0 ? (monthlyDebtPayment / monthlyIncome) * 100 : 0;

    if (dtiRatio > 40) {
        warnings.push({
            id: crypto.randomUUID(),
            metric: 'debt_to_income',
            severity: dtiRatio > 50 ? 'critical' : 'warning',
            message: `Debt-to-income ratio is ${dtiRatio.toFixed(1)}% — ${dtiRatio > 50 ? 'critically high' : 'above recommended'}. Target is below 36%.`,
            currentValue: Math.round(dtiRatio * 10) / 10,
            thresholdValue: 36,
            trendDirection: 'stable' // simplified
        });
    }

    // 2. Savings Rate Warning
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    if (savingsRate < 10) {
        warnings.push({
            id: crypto.randomUUID(),
            metric: 'savings_rate',
            severity: savingsRate < 0 ? 'critical' : savingsRate < 5 ? 'warning' : 'info',
            message: savingsRate < 0
                ? `You're spending more than you earn (${savingsRate.toFixed(1)}% savings rate). Immediate action needed.`
                : `Savings rate of ${savingsRate.toFixed(1)}% is below the recommended 20%. Consider reducing discretionary spending.`,
            currentValue: Math.round(savingsRate * 10) / 10,
            thresholdValue: 20,
            trendDirection: savingsRate < 0 ? 'worsening' : 'stable'
        });
    }

    // 3. Spending Velocity Warning
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    const recentExpenses = expenses.filter(t => new Date(t.date).getTime() >= thirtyDaysAgo);
    const previousExpenses = expenses.filter(t => {
        const time = new Date(t.date).getTime();
        return time >= sixtyDaysAgo && time < thirtyDaysAgo;
    });

    const recentTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);
    const previousTotal = previousExpenses.reduce((sum, t) => sum + t.amount, 0);

    if (previousTotal > 0) {
        const spendingChange = ((recentTotal - previousTotal) / previousTotal) * 100;
        if (spendingChange > 20) {
            warnings.push({
                id: crypto.randomUUID(),
                metric: 'spending_velocity',
                severity: spendingChange > 40 ? 'critical' : 'warning',
                message: `Spending has surged ${spendingChange.toFixed(0)}% vs last month. Review recent expenses for unexpected increases.`,
                currentValue: Math.round(spendingChange),
                thresholdValue: 20,
                trendDirection: 'worsening'
            });
        }
    }

    // 4. Budget Adherence Warning
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    let overBudgetCount = 0;

    currentBudgets.forEach(budget => {
        const spent = expenses
            .filter(t => t.category === budget.category && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);
        if (spent > budget.amount * 1.1) overBudgetCount++;
    });

    if (currentBudgets.length > 0 && overBudgetCount / currentBudgets.length > 0.5) {
        warnings.push({
            id: crypto.randomUUID(),
            metric: 'budget_adherence',
            severity: 'warning',
            message: `${overBudgetCount} of ${currentBudgets.length} budget categories are overspent this month. Budget discipline is deteriorating.`,
            currentValue: overBudgetCount,
            thresholdValue: 0,
            trendDirection: 'worsening'
        });
    }

    // 5. Emergency Fund Warning (using savings goals)
    const emergencyGoal = savingsGoals.find(g =>
        g.name.toLowerCase().includes('emergency') || g.name.toLowerCase().includes('rainy day')
    );
    if (emergencyGoal) {
        const coverage = emergencyGoal.targetAmount > 0 ? (emergencyGoal.currentAmount / emergencyGoal.targetAmount) * 100 : 0;
        if (coverage < 50) {
            warnings.push({
                id: crypto.randomUUID(),
                metric: 'emergency_fund',
                severity: coverage < 25 ? 'critical' : 'warning',
                message: `Emergency fund is only ${coverage.toFixed(0)}% funded. Recommend prioritizing contributions until 100% adequacy.`,
                currentValue: Math.round(coverage),
                thresholdValue: 100,
                trendDirection: coverage > 0 ? 'improving' : 'stable'
            });
        }
    }

    return warnings.sort((a, b) => {
        const severityOrder = { 'critical': 0, 'warning': 1, 'info': 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });
};

// ============================================
// ACTIONABLE OPTIMIZATION RECOMMENDATIONS
// ============================================

const generateOptimizationActions = (
    transactions: Transaction[],
    budgets: Budget[],
    debts: Debt[],
    currentScore: number,
    warnings: EarlyWarning[]
): HealthOptimizationAction[] => {
    const actions: HealthOptimizationAction[] = [];
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const monthCount = Math.max(1, getMonthSpan(transactions));
    const avgMonthlyExpense = totalExpense / monthCount;
    const avgMonthlyIncome = totalIncome / monthCount;

    let priority = 1;

    // Find top discretionary spending categories to cut
    const categorySpending = new Map<Category, number>();
    expenses.forEach(t => {
        categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });

    const discretionarySpending = Array.from(categorySpending.entries())
        .filter(([cat]) => ['Shopping', 'Entertainment', 'Travel'].includes(cat))
        .sort((a, b) => b[1] - a[1]);

    // Action 1: Cut top discretionary category
    if (discretionarySpending.length > 0 && currentScore < 80) {
        const [topCat, topAmount] = discretionarySpending[0];
        const monthlyAvg = topAmount / monthCount;
        const cutTarget = Math.round(monthlyAvg * 0.15);
        const impact = Math.min(5, Math.round(cutTarget / avgMonthlyIncome * 50));

        actions.push({
            id: crypto.randomUUID(),
            title: `Reduce ${topCat} spending by 15%`,
            description: `Cut ${topCat} by ~${cutTarget.toFixed(0)}/month (from ~${monthlyAvg.toFixed(0)}) to improve your savings ratio and health score.`,
            category: topCat,
            estimatedImpact: impact,
            effort: 'moderate',
            priority: priority++,
            timeframe: 'This month',
            isCompleted: false
        });
    }

    // Action 2: Increase savings if low
    const savingsRate = avgMonthlyIncome > 0 ? (avgMonthlyIncome - avgMonthlyExpense) / avgMonthlyIncome : 0;
    if (savingsRate < 0.2) {
        const targetSavings = Math.round(avgMonthlyIncome * 0.2);
        const currentSavings = Math.round(avgMonthlyIncome - avgMonthlyExpense);
        const gap = targetSavings - currentSavings;

        if (gap > 0) {
            actions.push({
                id: crypto.randomUUID(),
                title: `Boost monthly savings by ${gap.toFixed(0)}`,
                description: `Target 20% savings rate. Currently at ${(savingsRate * 100).toFixed(1)}%. Automate a transfer of ${gap.toFixed(0)} to savings each month.`,
                category: 'general',
                estimatedImpact: Math.min(8, Math.round(gap / avgMonthlyIncome * 40)),
                effort: gap > avgMonthlyIncome * 0.1 ? 'hard' : 'moderate',
                priority: priority++,
                timeframe: 'This month',
                isCompleted: false
            });
        }
    }

    // Action 3: Debt reduction strategy
    if (debts.length > 0) {
        const highInterestDebts = debts.filter(d => d.interestRate > 10).sort((a, b) => b.interestRate - a.interestRate);
        if (highInterestDebts.length > 0) {
            const target = highInterestDebts[0];
            const extraPayment = Math.round(target.minimumPayment * 0.5);
            actions.push({
                id: crypto.randomUUID(),
                title: `Accelerate ${target.name} payoff`,
                description: `Pay an extra ${extraPayment}/month on ${target.name} (${target.interestRate}% APR). This is your highest-interest debt and will save the most in interest.`,
                category: 'general',
                estimatedImpact: Math.min(6, Math.round(target.interestRate / 3)),
                effort: extraPayment > avgMonthlyIncome * 0.05 ? 'hard' : 'moderate',
                priority: priority++,
                timeframe: 'Next 90 days',
                isCompleted: false
            });
        }
    }

    // Action 4: Budget optimization
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    const unbudgetedCategories = Array.from(categorySpending.keys())
        .filter(cat => !currentBudgets.some(b => b.category === cat) && cat !== 'Salary' && cat !== 'Investment');

    if (unbudgetedCategories.length > 0) {
        actions.push({
            id: crypto.randomUUID(),
            title: `Set budgets for ${unbudgetedCategories.length} untracked categories`,
            description: `Categories without budgets: ${unbudgetedCategories.slice(0, 3).join(', ')}${unbudgetedCategories.length > 3 ? '...' : ''}. Setting budgets improves financial awareness and control.`,
            category: 'general',
            estimatedImpact: Math.min(4, unbudgetedCategories.length),
            effort: 'easy',
            priority: priority++,
            timeframe: 'This week',
            isCompleted: false
        });
    }

    // Action 5: Address worst early warning
    if (warnings.length > 0) {
        const worstWarning = warnings[0];
        actions.push({
            id: crypto.randomUUID(),
            title: `Address: ${worstWarning.metric.replace(/_/g, ' ')}`,
            description: worstWarning.message,
            category: 'general',
            estimatedImpact: worstWarning.severity === 'critical' ? 7 : worstWarning.severity === 'warning' ? 4 : 2,
            effort: worstWarning.severity === 'critical' ? 'hard' : 'moderate',
            priority: priority++,
            timeframe: worstWarning.severity === 'critical' ? 'This week' : 'This month',
            isCompleted: false
        });
    }

    return actions;
};

// ============================================
// RISK LEVEL ASSESSMENT
// ============================================

const assessRiskLevel = (
    currentScore: number,
    warnings: EarlyWarning[],
    trajectory: HealthTrajectoryPoint[]
): 'low' | 'moderate' | 'elevated' | 'high' | 'critical' => {
    const criticalWarnings = warnings.filter(w => w.severity === 'critical').length;
    const warningCount = warnings.filter(w => w.severity === 'warning').length;
    const ninetyDayPrediction = trajectory.find(t => t.daysAhead === 90);
    const scoreDecline = ninetyDayPrediction ? currentScore - ninetyDayPrediction.predictedScore : 0;

    // Composite risk score
    let riskScore = 0;
    riskScore += Math.max(0, (50 - currentScore) * 2); // Low current score = high risk
    riskScore += criticalWarnings * 25;
    riskScore += warningCount * 10;
    riskScore += Math.max(0, scoreDecline * 3); // Declining trajectory

    if (riskScore >= 80) return 'critical';
    if (riskScore >= 55) return 'high';
    if (riskScore >= 35) return 'elevated';
    if (riskScore >= 15) return 'moderate';
    return 'low';
};

// ============================================
// HELPERS
// ============================================

const getMonthSpan = (transactions: Transaction[]): number => {
    if (transactions.length === 0) return 1;
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    return Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 30)));
};

// ============================================
// MAIN OPTIMIZER
// ============================================

export const generateHealthOptimization = (
    transactions: Transaction[],
    budgets: Budget[],
    debts: Debt[],
    savingsGoals: SavingsGoal[],
    healthScore: FinancialHealthScore | null
): ProactiveHealthOptimization | null => {
    if (transactions.length < 10) return null;

    const currentScore = healthScore?.overallScore ?? 50;

    // Calculate previous month score for change tracking
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const olderTransactions = transactions.filter(t => new Date(t.date) <= thirtyDaysAgo);
    const olderExpenses = olderTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const olderIncome = olderTransactions.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const previousSavingsRate = olderIncome > 0 ? (olderIncome - olderExpenses) / olderIncome : 0;
    const previousScoreEstimate = Math.round(Math.min(100, Math.max(0, previousSavingsRate * 200 + 30)));
    const scoreChange = currentScore - previousScoreEstimate;

    // Run all modules
    const trajectory = predictHealthTrajectory(transactions, currentScore, debts);
    const warnings = generateEarlyWarnings(transactions, debts, budgets, savingsGoals);
    const actions = generateOptimizationActions(transactions, budgets, debts, currentScore, warnings);
    const riskLevel = assessRiskLevel(currentScore, warnings, trajectory);

    return {
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        currentScore,
        riskLevel,
        trajectory,
        earlyWarnings: warnings,
        actions,
        scoreChangeFromLastMonth: Math.round(scoreChange)
    };
};
