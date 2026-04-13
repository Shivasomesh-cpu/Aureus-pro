import {
    Transaction,
    TransactionType,
    Budget,
    SavingsGoal,
    Debt,
    FinancialHealthScore,
    Category
} from '../types';
import { calculateFinancialHealthScore } from './healthScoreService';

/**
 * Aureus Alchemist — What-If Budget Simulator
 * 
 * Simulates hypothetical budget adjustments and predicts their impact
 * on Financial Health Score and Savings Goal timelines.
 */

export interface BudgetAdjustment {
    category: Category;
    adjustmentPercent: number; // -50 to +50
}

export interface AlchemistSimulationResult {
    currentHealthScore: number;
    predictedHealthScore: number;
    scoreDelta: number;
    currentMonthlySavings: number;
    predictedMonthlySavings: number;
    savingsDelta: number;
    goalImpacts: GoalImpact[];
    categoryBreakdown: CategoryImpact[];
}

export interface GoalImpact {
    goalName: string;
    currentMonthsToGoal: number;
    predictedMonthsToGoal: number;
    monthsSaved: number; // positive = faster, negative = slower
    color: string;
}

export interface CategoryImpact {
    category: Category;
    currentMonthlySpend: number;
    adjustedMonthlySpend: number;
    change: number;
}

/**
 * Run the What-If simulation
 */
export function simulateBudgetChanges(
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    debts: Debt[],
    healthScore: FinancialHealthScore | null,
    adjustments: BudgetAdjustment[]
): AlchemistSimulationResult {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);

    // Calculate time span for monthly averages
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const monthSpan = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24 * 30));

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const monthlyIncome = totalIncome / monthSpan;
    const monthlyExpense = totalExpense / monthSpan;
    const currentMonthlySavings = monthlyIncome - monthlyExpense;

    // Calculate per-category monthly spending
    const categorySpending = new Map<Category, number>();
    expenses.forEach(t => {
        categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
    });

    // Apply adjustments
    let totalAdjustment = 0;
    const categoryBreakdown: CategoryImpact[] = [];
    const adjustmentMap = new Map(adjustments.map(a => [a.category, a.adjustmentPercent]));

    for (const [category, totalSpent] of categorySpending.entries()) {
        const monthlySpend = totalSpent / monthSpan;
        const adjustPercent = adjustmentMap.get(category) || 0;
        const adjustedSpend = monthlySpend * (1 + adjustPercent / 100);
        const change = adjustedSpend - monthlySpend;
        totalAdjustment += change;

        categoryBreakdown.push({
            category,
            currentMonthlySpend: Math.round(monthlySpend * 100) / 100,
            adjustedMonthlySpend: Math.round(adjustedSpend * 100) / 100,
            change: Math.round(change * 100) / 100
        });
    }

    const predictedMonthlySavings = currentMonthlySavings - totalAdjustment;

    // Simulate new health score by creating synthetic adjusted transactions
    const currentScore = healthScore?.overallScore ?? 50;

    // Estimate score impact based on savings rate change
    const currentSavingsRate = monthlyIncome > 0 ? currentMonthlySavings / monthlyIncome : 0;
    const predictedSavingsRate = monthlyIncome > 0 ? predictedMonthlySavings / monthlyIncome : 0;
    const savingsRateChange = predictedSavingsRate - currentSavingsRate;

    // Each 1% savings rate improvement ≈ 1.5 health points
    const scoreDelta = Math.round(savingsRateChange * 150);
    const predictedHealthScore = Math.max(0, Math.min(100, currentScore + scoreDelta));

    // Calculate savings goal impacts
    const goalImpacts: GoalImpact[] = savingsGoals.map(goal => {
        const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

        const currentMonths = currentMonthlySavings > 0
            ? Math.ceil(remaining / (currentMonthlySavings * 0.3)) // Assume 30% of savings goes to goals
            : 999;

        const predictedMonths = predictedMonthlySavings > 0
            ? Math.ceil(remaining / (predictedMonthlySavings * 0.3))
            : 999;

        return {
            goalName: goal.name,
            currentMonthsToGoal: Math.min(currentMonths, 999),
            predictedMonthsToGoal: Math.min(predictedMonths, 999),
            monthsSaved: currentMonths - predictedMonths,
            color: goal.color
        };
    });

    return {
        currentHealthScore: currentScore,
        predictedHealthScore,
        scoreDelta,
        currentMonthlySavings: Math.round(currentMonthlySavings * 100) / 100,
        predictedMonthlySavings: Math.round(predictedMonthlySavings * 100) / 100,
        savingsDelta: Math.round((predictedMonthlySavings - currentMonthlySavings) * 100) / 100,
        goalImpacts,
        categoryBreakdown: categoryBreakdown.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    };
}

/**
 * Get the adjustable categories from transactions
 */
export function getAdjustableCategories(transactions: Transaction[]): Category[] {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categorySet = new Set<Category>();
    expenses.forEach(t => categorySet.add(t.category));

    // Filter to categories that make sense to adjust
    const discretionary: Category[] = ['Food', 'Shopping', 'Entertainment', 'Travel', 'Transportation', 'Health', 'Education'];
    return discretionary.filter(c => categorySet.has(c));
}
