import {
    FinancialHealthScore,
    CreditScore,
    EmergencyFundMetrics,
    RetirementMetrics,
    DebtHealthMetrics,
    Transaction,
    TransactionType,
    Debt,
    SavingsGoal
} from '../types';

/**
 * Financial Health Score Service
 * 
 * Calculates comprehensive financial health metrics:
 * - Credit score simulation (300-850)
 * - Emergency fund adequacy
 * - Retirement readiness
 * - Debt health
 */

/**
 * Calculate simulated credit score based on financial behavior
 */
export function calculateCreditScore(
    transactions: Transaction[],
    debts: Debt[],
    accountAgeMonths: number = 24 // Default 2 years
): CreditScore {
    // Payment History (35% weight) - Based on consistent income and no late payments
    const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
    const hasRegularIncome = incomeTransactions.length >= 3;
    const paymentHistory = hasRegularIncome ? 90 : 60; // 0-100 score

    // Credit Utilization (30% weight) - Revolving Debt vs Available Credit Line
    const creditCardDebt = debts.filter(d => d.type === 'credit_card').reduce((sum, d) => sum + d.balance, 0);
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
    const distinctMonths = Math.max(1, new Set(transactions.map(t => t.date.slice(0, 7))).size);
    const monthlyIncome = totalIncome / distinctMonths;
    const baselineLimit = Math.max(5000, monthlyIncome * 3.5);
    const activeRevolving = creditCardDebt > 0 ? creditCardDebt : totalDebt * 0.25;
    const utilizationRatio = Math.min(1, activeRevolving / baselineLimit);
    const creditUtilization = Math.round(Math.max(0, (1 - utilizationRatio) * 100));

    // Account Age (15% weight)
    const accountAge = Math.min(100, (accountAgeMonths / 120) * 100); // Max at 10 years

    // Credit Mix (10% weight) - Variety of debt types
    const debtTypes = new Set(debts.map(d => d.type));
    const creditMix = Math.min(100, (debtTypes.size / 5) * 100); // Max 5 types

    // New Credit (10% weight) - Assume good if not too many debts
    const newCredit = debts.length <= 3 ? 85 : Math.max(50, 100 - (debts.length * 10));

    // Calculate weighted score
    const rawScore =
        (paymentHistory * 0.35) +
        (creditUtilization * 0.30) +
        (accountAge * 0.15) +
        (creditMix * 0.10) +
        (newCredit * 0.10);

    // Convert to 300-850 range
    const score = Math.round(300 + (rawScore / 100) * 550);

    // Determine rating
    let rating: CreditScore['rating'];
    if (score >= 800) rating = 'Excellent';
    else if (score >= 740) rating = 'Very Good';
    else if (score >= 670) rating = 'Good';
    else if (score >= 580) rating = 'Fair';
    else rating = 'Poor';

    return {
        score,
        rating,
        factors: {
            paymentHistory,
            creditUtilization,
            accountAge,
            creditMix,
            newCredit,
        },
    };
}

/**
 * Calculate emergency fund adequacy
 */
export function calculateEmergencyFund(
    transactions: Transaction[],
    savingsGoals: SavingsGoal[]
): EmergencyFundMetrics {
    // Calculate average monthly expenses based on actual data range
    const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);

    if (expenseTransactions.length === 0) {
        return {
            currentAmount: 0,
            recommendedAmount: 5000,
            monthsCovered: 0,
            adequacy: 'Critical',
            monthlyExpenses: 5000,
        };
    }

    // Sort by date to find the time span
    const sortedExpenses = [...expenseTransactions].sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const firstDate = new Date(sortedExpenses[0].date);
    const lastDate = new Date(sortedExpenses[sortedExpenses.length - 1].date);

    // Calculate months difference (min 1 month)
    const monthsDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = totalExpenses / monthsDiff;

    // Find emergency fund savings goal
    const emergencyFund = savingsGoals.find(g =>
        g.name.toLowerCase().includes('emergency') ||
        g.name.toLowerCase().includes('nest egg') ||
        g.name.toLowerCase().includes('rainy day')
    );

    const currentAmount = emergencyFund?.currentAmount || 0;

    // Recommended: 6 months of expenses for established middle-class families
    const recommendedAmount = monthlyExpenses * 6;

    const monthsCovered = monthlyExpenses > 0 ? currentAmount / monthlyExpenses : 0;

    // Determine adequacy
    let adequacy: EmergencyFundMetrics['adequacy'];
    if (monthsCovered >= 6) adequacy = 'Excellent';
    else if (monthsCovered >= 4) adequacy = 'Good';
    else if (monthsCovered >= 2) adequacy = 'Moderate';
    else if (monthsCovered >= 1) adequacy = 'Low';
    else adequacy = 'Critical';

    return {
        currentAmount,
        recommendedAmount,
        monthsCovered,
        adequacy,
        monthlyExpenses,
    };
}

/**
 * Calculate retirement readiness
 */
export function calculateRetirementReadiness(
    transactions: Transaction[],
    savingsGoals: SavingsGoal[],
    currentAge: number = 35,
    retirementAge: number = 65
): RetirementMetrics {
    // Find retirement or investment savings
    const retirementGoal = savingsGoals.find(g =>
        g.name.toLowerCase().includes('retirement') ||
        g.name.toLowerCase().includes('investment') ||
        g.name.toLowerCase().includes('401k') ||
        g.name.toLowerCase().includes('ira')
    );

    const currentSavings = retirementGoal?.currentAmount || 0;

    // Calculate monthly contribution (from recent savings/investment transactions)
    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Look for both income (employer match/windfalls) and expenses (personal contributions) 
    // in Investment/Savings categories
    const investmentTransactions = transactions.filter(t =>
        (t.category.toLowerCase() === 'investment' || t.category.toLowerCase() === 'savings') &&
        new Date(t.date) >= sixMonthsAgo
    );

    // In many setups, a 401k contribution is an "expense" (outflow from checking)
    // or an "income" (if tracking the account itself as a ledger)
    // We'll take the absolute sum and average it
    const totalInvested = investmentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const monthsDiff = Math.max(1, (now.getTime() - sixMonthsAgo.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthlyContribution = totalInvested / monthsDiff;

    const yearsToRetirement = Math.max(0, retirementAge - currentAge);

    // Simple projection (assuming 7% annual return for a middle-class balanced portfolio)
    const annualReturn = 0.07;
    const monthlyReturn = annualReturn / 12;
    const months = yearsToRetirement * 12;

    // FV = P(1+r)^n + PMT[(1+r)^n - 1]/r
    const futureValue = currentSavings * Math.pow(1 + monthlyReturn, months) +
        monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

    // Estimate required retirement income (70% of current net income)
    const incomeTransactions = transactions.filter(t =>
        t.type === TransactionType.INCOME &&
        (t.category.toLowerCase() === 'salary' || t.category.toLowerCase() === 'income')
    );

    // Calculate average monthly income over the period
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = totalIncome / monthsDiff;
    const avgMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 5000; // Default fallback for middle-class

    const requiredMonthlyIncome = avgMonthlyIncome * 0.7;

    // Assume 4% safe withdrawal rate in retirement
    const projectedRetirementIncome = (futureValue * 0.04) / 12;

    // Determine readiness
    let readiness: RetirementMetrics['readiness'];
    const readinessRatio = requiredMonthlyIncome > 0 ? projectedRetirementIncome / requiredMonthlyIncome : 1;

    if (readinessRatio >= 1.2) readiness = 'Ahead';
    else if (readinessRatio >= 0.8) readiness = 'On Track';
    else readiness = 'Behind';

    return {
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        projectedRetirementIncome,
        requiredMonthlyIncome,
        readiness,
        yearsToRetirement,
    };
}

/**
 * Calculate debt health metrics
 */
export function calculateDebtHealth(
    transactions: Transaction[],
    debts: Debt[]
): DebtHealthMetrics {
    const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);

    // Calculate monthly income based on actual data range
    const incomeTransactions = transactions.filter(t =>
        t.type === TransactionType.INCOME &&
        (t.category.toLowerCase() === 'salary' || t.category.toLowerCase() === 'income')
    );

    // Sort by date to find the time span
    const sortedDays = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstDate = new Date(sortedDays[0]?.date || new Date());
    const lastDate = new Date(sortedDays[sortedDays.length - 1]?.date || new Date());
    const monthsDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = totalIncome / monthsDiff;

    // Calculate debt-to-income ratio
    const monthlyDebtPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
    const debtToIncomeRatio = monthlyIncome > 0
        ? (monthlyDebtPayment / monthlyIncome) * 100
        : 0;

    // Determine rating
    let rating: DebtHealthMetrics['rating'];
    let recommendation: string;

    if (debtToIncomeRatio === 0) {
        rating = 'Excellent';
        recommendation = 'You have no debt! Keep up the great work and focus on building wealth.';
    } else if (debtToIncomeRatio < 20) {
        rating = 'Excellent';
        recommendation = 'Your debt level is very manageable. Continue making payments on time.';
    } else if (debtToIncomeRatio < 36) {
        rating = 'Good';
        recommendation = 'Your debt is under control, but consider paying down high-interest debts faster.';
    } else if (debtToIncomeRatio < 43) {
        rating = 'Fair';
        recommendation = 'Your debt level is concerning. Focus on reducing debt before taking on new obligations.';
    } else if (debtToIncomeRatio < 50) {
        rating = 'Poor';
        recommendation = 'Your debt level is high. Consider debt consolidation or speaking with a financial advisor.';
    } else {
        rating = 'Critical';
        recommendation = 'Your debt level is critical. Seek professional financial counseling immediately.';
    }

    return {
        totalDebt,
        monthlyIncome,
        debtToIncomeRatio,
        rating,
        recommendation,
    };
}

/**
 * Calculate overall financial health score
 */
export function calculateFinancialHealthScore(
    transactions: Transaction[],
    debts: Debt[],
    savingsGoals: SavingsGoal[],
    currentAge?: number
): FinancialHealthScore {
    const creditScore = calculateCreditScore(transactions, debts);
    const emergencyFund = calculateEmergencyFund(transactions, savingsGoals);
    const retirement = calculateRetirementReadiness(transactions, savingsGoals, currentAge);
    const debtHealth = calculateDebtHealth(transactions, debts);

    // Calculate overall score (0-100)
    // Credit score: 30% weight
    const creditScoreNormalized = ((creditScore.score - 300) / 550) * 100;
    const creditWeight = creditScoreNormalized * 0.30;

    // Emergency fund: 25% weight
    const emergencyFundScore = Math.min(100, (emergencyFund.monthsCovered / 6) * 100);
    const emergencyWeight = emergencyFundScore * 0.25;

    // Retirement: 25% weight
    const retirementScore = retirement.readiness === 'Ahead' ? 100 :
        retirement.readiness === 'On Track' ? 75 : 50;
    const retirementWeight = retirementScore * 0.25;

    // Debt health: 20% weight
    const debtScore = debtHealth.rating === 'Excellent' ? 100 :
        debtHealth.rating === 'Good' ? 80 :
            debtHealth.rating === 'Fair' ? 60 :
                debtHealth.rating === 'Poor' ? 40 : 20;
    const debtWeight = debtScore * 0.20;

    const overallScore = Math.round(creditWeight + emergencyWeight + retirementWeight + debtWeight);

    return {
        overallScore,
        creditScore,
        emergencyFund,
        retirement,
        debtHealth,
        lastCalculated: new Date().toISOString(),
    };
}
