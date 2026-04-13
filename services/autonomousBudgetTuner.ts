import {
    Transaction,
    TransactionType,
    Budget,
    Category,
    BudgetTuningRecommendation,
    AutonomousBudgetTuning,
    BehavioralProfile
} from '../types';

/**
 * Autonomous Budget Tuner
 * 
 * Self-adjusting budget system that analyzes spending patterns,
 * detects seasonal variations, and generates smart reallocation
 * recommendations with confidence scoring.
 */

const ESSENTIAL_CATEGORIES: Category[] = ['Housing', 'Utilities', 'Food', 'Transportation', 'Healthcare'];
const DISCRETIONARY_CATEGORIES: Category[] = ['Shopping', 'Entertainment', 'Travel', 'Education', 'Other'];

// ============================================
// SEASONAL DETECTION
// ============================================

const detectSeason = (): string => {
    const month = new Date().getMonth();
    // Nov-Dec: Holiday Season
    if (month >= 10) return 'Holiday Season';
    // Jun-Aug: Summer / Travel Season
    if (month >= 5 && month <= 7) return 'Summer Season';
    // Aug-Sep: Back-to-School
    if (month >= 7 && month <= 8) return 'Back-to-School';
    // Jan-Feb: New Year / Recovery
    if (month <= 1) return 'New Year Recovery';
    // Mar-May: Spring / Normal
    return 'Normal';
};

const getSeasonalMultiplier = (category: Category, season: string): number => {
    const multipliers: Record<string, Partial<Record<Category, number>>> = {
        'Holiday Season': {
            'Shopping': 1.4, 'Entertainment': 1.3, 'Travel': 1.5, 'Food': 1.2
        },
        'Summer Season': {
            'Travel': 1.6, 'Entertainment': 1.3, 'Shopping': 1.1
        },
        'Back-to-School': {
            'Education': 1.8, 'Shopping': 1.3
        },
        'New Year Recovery': {
            'Shopping': 0.7, 'Entertainment': 0.8, 'Travel': 0.6
        },
        'Normal': {}
    };

    return multipliers[season]?.[category] ?? 1.0;
};

// ============================================
// SPENDING ANALYSIS PER CATEGORY
// ============================================

interface CategorySpendingAnalysis {
    category: Category;
    avgMonthlySpend: number;
    monthlyBreakdown: number[];
    trendDirection: 'rising' | 'falling' | 'stable';
    varianceCoefficient: number;
    isEssential: boolean;
}

const analyzeSpendingByCategory = (transactions: Transaction[]): CategorySpendingAnalysis[] => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) return [];

    // Group by category and month
    const categoryMonthMap = new Map<Category, Map<string, number>>();

    expenses.forEach(t => {
        const month = t.date.slice(0, 7);
        if (!categoryMonthMap.has(t.category)) {
            categoryMonthMap.set(t.category, new Map());
        }
        const monthMap = categoryMonthMap.get(t.category)!;
        monthMap.set(month, (monthMap.get(month) || 0) + t.amount);
    });

    const analyses: CategorySpendingAnalysis[] = [];

    categoryMonthMap.forEach((monthMap, category) => {
        const monthlyValues = Array.from(monthMap.values());
        if (monthlyValues.length === 0) return;

        const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
        const variance = monthlyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / monthlyValues.length;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? stdDev / avg : 0;

        // Trend: compare first half vs second half
        let trend: 'rising' | 'falling' | 'stable' = 'stable';
        if (monthlyValues.length >= 2) {
            const mid = Math.floor(monthlyValues.length / 2);
            const firstHalfAvg = monthlyValues.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
            const secondHalfAvg = monthlyValues.slice(mid).reduce((a, b) => a + b, 0) / (monthlyValues.length - mid);
            const change = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : 0;
            if (change > 0.1) trend = 'rising';
            else if (change < -0.1) trend = 'falling';
        }

        analyses.push({
            category,
            avgMonthlySpend: Math.round(avg * 100) / 100,
            monthlyBreakdown: monthlyValues,
            trendDirection: trend,
            varianceCoefficient: Math.round(cv * 100) / 100,
            isEssential: ESSENTIAL_CATEGORIES.includes(category)
        });
    });

    return analyses;
};

// ============================================
// RECOMMENDATION GENERATION
// ============================================

const generateRecommendations = (
    budgets: Budget[],
    spendingAnalysis: CategorySpendingAnalysis[],
    season: string
): BudgetTuningRecommendation[] => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentBudgets = budgets.filter(b => b.month === currentMonth);
    // Also look at recent months if current month has no budgets
    const allRecentBudgets = budgets.filter(b => {
        const budgetDate = new Date(b.month + '-01');
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return budgetDate >= threeMonthsAgo;
    });
    const effectiveBudgets = currentBudgets.length > 0 ? currentBudgets : allRecentBudgets;
    const recommendations: BudgetTuningRecommendation[] = [];

    // For each spending category, generate a recommendation
    spendingAnalysis.forEach(analysis => {
        const existingBudget = effectiveBudgets.find(b => b.category === analysis.category);
        const seasonalMultiplier = getSeasonalMultiplier(analysis.category, season);
        const adjustedAvg = analysis.avgMonthlySpend * seasonalMultiplier;

        if (existingBudget) {
            const currentBudget = existingBudget.amount;
            const utilizationRate = currentBudget > 0 ? analysis.avgMonthlySpend / currentBudget : 0;

            // Under-utilized budget (spending < 75% of budget) — tighter threshold
            if (utilizationRate < 0.75) {
                const suggested = Math.round(adjustedAvg * 1.15); // 15% buffer above actual spending
                const changeAmount = suggested - currentBudget;
                const changePercentage = currentBudget > 0 ? (changeAmount / currentBudget) * 100 : 0;

                // Lowered threshold: recommend if decrease > 5%
                if (changePercentage < -5) {
                    const confidence = Math.min(95, Math.round(
                        70 +
                        (analysis.monthlyBreakdown.length * 3) -
                        (analysis.varianceCoefficient * 15)
                    ));

                    recommendations.push({
                        category: analysis.category,
                        currentBudget,
                        suggestedBudget: suggested,
                        changeAmount,
                        changePercentage: Math.round(changePercentage),
                        confidence: Math.max(30, confidence),
                        reason: `You consistently spend only ${Math.round(utilizationRate * 100)}% of this budget. The surplus of ${Math.abs(changeAmount).toFixed(0)} can be reallocated to savings or other priorities.`,
                        priority: analysis.isEssential ? 'low' : 'medium',
                        type: 'decrease'
                    });
                }
            }
            // Over-utilized budget (spending > 95% of budget) — tighter threshold
            else if (utilizationRate > 0.95) {
                const suggested = Math.round(adjustedAvg * 1.1); // 10% buffer above actual
                const changeAmount = suggested - currentBudget;
                const changePercentage = currentBudget > 0 ? (changeAmount / currentBudget) * 100 : 0;

                if (changePercentage > 3) {
                    const confidence = Math.min(95, Math.round(
                        65 +
                        (analysis.monthlyBreakdown.length * 3) -
                        (analysis.varianceCoefficient * 10)
                    ));

                    recommendations.push({
                        category: analysis.category,
                        currentBudget,
                        suggestedBudget: suggested,
                        changeAmount,
                        changePercentage: Math.round(changePercentage),
                        confidence: Math.max(30, confidence),
                        reason: analysis.isEssential
                            ? `Essential spending at ${Math.round(utilizationRate * 100)}% utilization — nearly exceeding budget. Adjusting to prevent overage.`
                            : `Spending at ${Math.round(utilizationRate * 100)}% of budget. ${analysis.trendDirection === 'rising' ? 'Trend is rising — consider if this is intentional.' : 'Recommend adjusting to realistic levels.'}`,
                        priority: analysis.isEssential ? 'high' : 'medium',
                        type: 'increase'
                    });
                }
            }
            // Well-utilized range (75-95%) — still generate trend-based advice
            else {
                // Even for "maintain" range, flag categories with rising trends
                if (analysis.trendDirection === 'rising' && !analysis.isEssential) {
                    const suggested = Math.round(currentBudget * 0.9); // Suggest 10% reduction
                    recommendations.push({
                        category: analysis.category,
                        currentBudget,
                        suggestedBudget: suggested,
                        changeAmount: suggested - currentBudget,
                        changePercentage: -10,
                        confidence: 60,
                        reason: `Spending trend is rising in ${analysis.category}. Consider proactively reducing by 10% to counter lifestyle creep before it compounds.`,
                        priority: 'medium',
                        type: 'decrease'
                    });
                }
                // High variance categories get a recommendation to stabilize
                else if (analysis.varianceCoefficient > 0.3 && !analysis.isEssential) {
                    const suggested = Math.round(adjustedAvg * 1.05);
                    recommendations.push({
                        category: analysis.category,
                        currentBudget,
                        suggestedBudget: suggested,
                        changeAmount: suggested - currentBudget,
                        changePercentage: Math.round(((suggested - currentBudget) / currentBudget) * 100),
                        confidence: 55,
                        reason: `${analysis.category} spending is highly variable (${Math.round(analysis.varianceCoefficient * 100)}% variance). Tighter budgeting could help smooth cash flow.`,
                        priority: 'low',
                        type: suggested > currentBudget ? 'increase' : 'decrease'
                    });
                }
                // Savings optimization for large discretionary categories
                else if (!analysis.isEssential && analysis.avgMonthlySpend > 0) {
                    const savingsTarget = Math.round(currentBudget * 0.95);
                    if (savingsTarget < currentBudget) {
                        recommendations.push({
                            category: analysis.category,
                            currentBudget,
                            suggestedBudget: savingsTarget,
                            changeAmount: savingsTarget - currentBudget,
                            changePercentage: -5,
                            confidence: 70,
                            reason: `Budget is within target at ${Math.round(utilizationRate * 100)}% utilization. A modest 5% trim could free up ${Math.abs(savingsTarget - currentBudget).toFixed(0)} for your savings goals.`,
                            priority: 'low',
                            type: 'decrease'
                        });
                    }
                }
                // Essential categories that are well-calibrated get a positive "maintain"
                else {
                    recommendations.push({
                        category: analysis.category,
                        currentBudget,
                        suggestedBudget: currentBudget,
                        changeAmount: 0,
                        changePercentage: 0,
                        confidence: 90,
                        reason: `Budget is well-calibrated at ${Math.round(utilizationRate * 100)}% utilization. No changes needed.`,
                        priority: 'low',
                        type: 'maintain'
                    });
                }
            }
        }
        // No budget exists for this category — suggest one
        else if (analysis.avgMonthlySpend > 0) {
            const suggested = Math.round(adjustedAvg * 1.15);
            const confidence = Math.min(85, Math.round(50 + (analysis.monthlyBreakdown.length * 4)));

            recommendations.push({
                category: analysis.category,
                currentBudget: 0,
                suggestedBudget: suggested,
                changeAmount: suggested,
                changePercentage: 100,
                confidence: Math.max(30, confidence),
                reason: `No budget set for ${analysis.category}. Based on your avg spend of ${analysis.avgMonthlySpend.toFixed(0)}, we suggest ${suggested}.${seasonalMultiplier > 1 ? ` (Adjusted +${Math.round((seasonalMultiplier - 1) * 100)}% for ${season})` : ''}`,
                priority: analysis.isEssential ? 'high' : 'medium',
                type: 'new'
            });
        }
    });

    // Sort by priority and type (changes first, maintain last)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    const typeOrder = { 'new': 0, 'increase': 1, 'decrease': 2, 'maintain': 3 };

    return recommendations.sort((a, b) => {
        const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (pDiff !== 0) return pDiff;
        return typeOrder[a.type] - typeOrder[b.type];
    });
};

// ============================================
// OVERALL EFFICIENCY SCORING
// ============================================

const calculateOverallEfficiency = (budgets: Budget[], transactions: Transaction[]): number => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let currentBudgets = budgets.filter(b => b.month === currentMonth);
    // Fallback: use most recent month's budgets if none for current month
    if (currentBudgets.length === 0) {
        const sortedMonths = [...new Set(budgets.map(b => b.month))].sort().reverse();
        if (sortedMonths.length > 0) {
            currentBudgets = budgets.filter(b => b.month === sortedMonths[0]);
        }
    }
    if (currentBudgets.length === 0) return 50; // Default instead of 0

    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    let totalScore = 0;

    currentBudgets.forEach(budget => {
        const spent = expenses
            .filter(t => t.category === budget.category && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const utilization = budget.amount > 0 ? spent / budget.amount : 0;

        // Optimal utilization is 70-95%
        if (utilization >= 0.7 && utilization <= 0.95) {
            totalScore += 100;
        } else if (utilization >= 0.5 && utilization <= 1.1) {
            totalScore += 70;
        } else if (utilization > 1.1) {
            totalScore += Math.max(10, 50 - (utilization - 1.1) * 100);
        } else {
            totalScore += Math.max(10, utilization * 100);
        }
    });

    return Math.round(totalScore / currentBudgets.length);
};

// ============================================
// MAIN TUNER
// ============================================

export const generateBudgetTuning = (
    transactions: Transaction[],
    budgets: Budget[]
): AutonomousBudgetTuning | null => {
    if (transactions.length < 10) return null;

    const season = detectSeason();
    const spendingAnalysis = analyzeSpendingByCategory(transactions);
    const recommendations = generateRecommendations(budgets, spendingAnalysis, season);
    const efficiency = calculateOverallEfficiency(budgets, transactions);

    // Calculate total savings potential
    const savingsPotential = recommendations
        .filter(r => r.type === 'decrease' && r.changeAmount < 0)
        .reduce((sum, r) => sum + Math.abs(r.changeAmount), 0);

    return {
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        recommendations,
        totalSavingsPotential: Math.round(savingsPotential * 100) / 100,
        seasonalContext: season,
        overallEfficiency: efficiency
    };
};
