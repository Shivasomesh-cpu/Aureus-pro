import {
    FinancialHealthScore,
    EmergencyFundMetrics,
    RetirementMetrics,
    DebtHealthMetrics,
    Transaction,
    TransactionType,
    Debt,
    SavingsGoal,
    FinancialPlan
} from '../types';

/**
 * Financial Health Score Service
 * 
 * Calculates financial health metrics from user-entered records:
 * - Emergency fund adequacy
 * - Retirement readiness
 * - Debt health
 */

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
            recommendedAmount: 0,
            monthsCovered: 0,
            adequacy: 'Not set',
            monthlyExpenses: 0,
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
    plan?: FinancialPlan | null
): RetirementMetrics {
    // Find retirement or investment savings
    const retirementGoal = savingsGoals.find(g =>
        g.name.toLowerCase().includes('retirement') ||
        g.name.toLowerCase().includes('investment') ||
        g.name.toLowerCase().includes('401k') ||
        g.name.toLowerCase().includes('ira')
    );

    const currentSavings = plan?.retirementSavings ?? retirementGoal?.currentAmount ?? 0;

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
    const monthlyContribution = plan
        ? plan.sipInvestments.reduce((sum, investment) => sum + Math.max(0, investment.monthlyAmount), 0)
        : totalInvested / monthsDiff;

    const currentAge = plan?.currentAge ?? 0;
    const retirementAge = plan?.retirementAge ?? 0;

    const yearsToRetirement = Math.max(0, retirementAge - currentAge);

    const monthlyInvestmentTotal = plan?.sipInvestments.reduce((sum, investment) => sum + Math.max(0, investment.monthlyAmount), 0) ?? 0;
    const annualReturn = monthlyInvestmentTotal > 0
        ? plan!.sipInvestments.reduce((sum, investment) => sum + Math.max(0, investment.monthlyAmount) * investment.expectedAnnualReturn, 0) / monthlyInvestmentTotal / 100
        : 0;
    const monthlyReturn = annualReturn / 12;
    const months = yearsToRetirement * 12;

    // FV = P(1+r)^n + PMT[(1+r)^n - 1]/r
    const futureValue = monthlyReturn === 0
        ? currentSavings + monthlyContribution * months
        : currentSavings * Math.pow(1 + monthlyReturn, months) +
          monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);

    const requiredMonthlyIncome = plan?.desiredMonthlyRetirementIncome ?? 0;

    // Assume 4% safe withdrawal rate in retirement
    const projectedRetirementIncome = (futureValue * 0.04) / 12;

    // Determine readiness
    let readiness: RetirementMetrics['readiness'];
    const yearsInflation = Math.max(0, yearsToRetirement);
    const targetAtRetirement = requiredMonthlyIncome * Math.pow(1.03, yearsInflation);
    const readinessRatio = targetAtRetirement > 0 ? projectedRetirementIncome / targetAtRetirement : 0;

    if (!plan?.currentAge || !plan.retirementAge || !requiredMonthlyIncome) readiness = 'Not set';
    else if (readinessRatio >= 1.2) readiness = 'Ahead';
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

    if (monthlyIncome <= 0) {
        rating = 'Not set';
        recommendation = 'Add income transactions to estimate this ratio.';
    } else if (debtToIncomeRatio === 0) {
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
    plan?: FinancialPlan | null
): FinancialHealthScore {
    const emergencyFund = calculateEmergencyFund(transactions, savingsGoals);
    const retirement = calculateRetirementReadiness(transactions, savingsGoals, plan);
    const debtHealth = calculateDebtHealth(transactions, debts);

    // Calculate overall score (0-100)
    const emergencyFundScore = emergencyFund.monthlyExpenses > 0
        ? Math.min(100, (emergencyFund.monthsCovered / 6) * 100)
        : 50;
    const emergencyWeight = emergencyFundScore * 0.35;
    const retirementScore = retirement.readiness === 'Ahead' ? 100 :
        retirement.readiness === 'On Track' ? 75 : retirement.readiness === 'Behind' ? 35 : 50;
    const retirementWeight = retirementScore * 0.30;
    const debtScore = debtHealth.rating === 'Not set' ? 50 : debtHealth.rating === 'Excellent' ? 100 :
        debtHealth.rating === 'Good' ? 80 :
            debtHealth.rating === 'Fair' ? 60 :
                debtHealth.rating === 'Poor' ? 40 : 20;
    const debtWeight = debtScore * 0.35;

    const overallScore = Math.round(emergencyWeight + retirementWeight + debtWeight);

    return {
        overallScore,
        emergencyFund,
        retirement,
        debtHealth,
        lastCalculated: new Date().toISOString(),
    };
}
