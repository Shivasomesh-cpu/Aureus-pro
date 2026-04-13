import {
    Transaction,
    TransactionType,
    Category,
    BehavioralProfile,
    SpendingVelocity,
    CategoryAffinity,
    TemporalPattern,
    Budget,
    SavingsGoal
} from '../types';

/**
 * Deep Analysis Engine
 * 
 * Processes 90+ days of transaction history to generate behavioral profiles.
 * Uses statistical analysis, pattern recognition, and adaptive weighting
 * to understand the user's unique financial DNA.
 */

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MIN_DAYS_FOR_ANALYSIS = 30; // Minimum days, but optimized for 90+

// ============================================
// SPENDING VELOCITY ANALYSIS
// ============================================

const calculateSpendingVelocity = (transactions: Transaction[]): SpendingVelocity => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) {
        return { dailyBurnRate: 0, weeklyAverage: 0, monthlyAverage: 0, trend: 'stable', trendPercentage: 0 };
    }

    const dates = expenses.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);

    const dailyBurnRate = totalSpent / totalDays;
    const weeklyAverage = dailyBurnRate * 7;
    const monthlyAverage = dailyBurnRate * 30;

    // Trend: compare last 30 days vs previous 30 days
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

    let trend: 'accelerating' | 'decelerating' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (previousTotal > 0) {
        trendPercentage = ((recentTotal - previousTotal) / previousTotal) * 100;
        if (trendPercentage > 10) trend = 'accelerating';
        else if (trendPercentage < -10) trend = 'decelerating';
    }

    return {
        dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
        weeklyAverage: Math.round(weeklyAverage * 100) / 100,
        monthlyAverage: Math.round(monthlyAverage * 100) / 100,
        trend,
        trendPercentage: Math.round(trendPercentage * 10) / 10
    };
};

// ============================================
// CATEGORY AFFINITY ANALYSIS
// ============================================

const calculateCategoryAffinities = (transactions: Transaction[]): CategoryAffinity[] => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) return [];

    const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const categoryMap = new Map<Category, { count: number; total: number; amounts: number[] }>();

    expenses.forEach(t => {
        const existing = categoryMap.get(t.category) || { count: 0, total: 0, amounts: [] };
        existing.count++;
        existing.total += t.amount;
        existing.amounts.push(t.amount);
        categoryMap.set(t.category, existing);
    });

    // Calculate consistency (coefficient of variation — lower = more consistent)
    const affinities: CategoryAffinity[] = [];
    let rank = 1;

    const sorted = Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total);

    sorted.forEach(([category, data]) => {
        const avg = data.total / data.count;
        const variance = data.amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / data.count;
        const stdDev = Math.sqrt(variance);
        const cv = avg > 0 ? stdDev / avg : 1;
        const consistency = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));

        affinities.push({
            category,
            frequency: data.count,
            totalSpent: Math.round(data.total * 100) / 100,
            percentageOfTotal: totalSpent > 0 ? Math.round((data.total / totalSpent) * 1000) / 10 : 0,
            consistency,
            rank: rank++
        });
    });

    return affinities;
};

// ============================================
// TEMPORAL PATTERN ANALYSIS
// ============================================

const analyzeTemporalPatterns = (transactions: Transaction[]): TemporalPattern => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

    // Day of week distribution (0 = Sunday, 6 = Saturday)
    const dayTotals = [0, 0, 0, 0, 0, 0, 0];
    // Week of month distribution (0-3)
    const weekTotals = [0, 0, 0, 0];

    expenses.forEach(t => {
        const date = new Date(t.date);
        dayTotals[date.getDay()] += t.amount;
        const weekOfMonth = Math.min(3, Math.floor((date.getDate() - 1) / 7));
        weekTotals[weekOfMonth] += t.amount;
    });

    const peakDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
    const peakWeek = weekTotals.indexOf(Math.max(...weekTotals)) + 1;

    return {
        dayOfWeekDistribution: dayTotals.map(v => Math.round(v * 100) / 100),
        peakSpendingDay: DAY_NAMES[peakDayIndex],
        weekOfMonthDistribution: weekTotals.map(v => Math.round(v * 100) / 100),
        peakSpendingWeek: peakWeek
    };
};

// ============================================
// IMPULSE vs. PLANNED CLASSIFICATION
// ============================================

const classifyImpulseVsPlanned = (transactions: Transaction[]): { ratio: number; impulseCount: number; plannedCount: number } => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) return { ratio: 0, impulseCount: 0, plannedCount: 0 };

    // Group by category to find recurring patterns
    const categoryMap = new Map<string, number[]>();
    expenses.forEach(t => {
        const key = `${t.category}-${t.description.toLowerCase().trim()}`;
        const existing = categoryMap.get(key) || [];
        existing.push(t.amount);
        categoryMap.set(key, existing);
    });

    let impulseCount = 0;
    let plannedCount = 0;

    // Transactions with similar descriptions appearing multiple times = planned
    // One-off or highly variable = impulse
    expenses.forEach(t => {
        const key = `${t.category}-${t.description.toLowerCase().trim()}`;
        const occurrences = categoryMap.get(key) || [];

        if (occurrences.length >= 2) {
            // Check variance — low variance = planned
            const avg = occurrences.reduce((a, b) => a + b, 0) / occurrences.length;
            const variance = occurrences.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / occurrences.length;
            const cv = avg > 0 ? Math.sqrt(variance) / avg : 1;

            if (cv < 0.3) {
                plannedCount++;
            } else {
                impulseCount++;
            }
        } else {
            impulseCount++;
        }
    });

    const total = impulseCount + plannedCount;
    const ratio = total > 0 ? impulseCount / total : 0;

    return { ratio: Math.round(ratio * 100) / 100, impulseCount, plannedCount };
};

// ============================================
// RISK TOLERANCE SCORING
// ============================================

const calculateRiskTolerance = (
    transactions: Transaction[],
    savingsGoals: SavingsGoal[]
): { score: number; level: 'conservative' | 'moderate' | 'aggressive'; savingsConsistency: number } => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    // Factor 1: Savings rate (0-40 points)
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    const savingsPoints = Math.min(40, Math.max(0, savingsRate * 200)); // 20% savings = 40 points

    // Factor 2: Savings goal progress (0-30 points)
    let goalProgress = 0;
    if (savingsGoals.length > 0) {
        const avgProgress = savingsGoals.reduce((sum, g) => sum + (g.currentAmount / Math.max(g.targetAmount, 1)), 0) / savingsGoals.length;
        goalProgress = Math.min(30, avgProgress * 30);
    }

    // Factor 3: Spending consistency — lower variance = more conservative (0-30 points)
    const monthlyExpenses = new Map<string, number>();
    expenses.forEach(t => {
        const month = t.date.slice(0, 7);
        monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + t.amount);
    });

    const monthlyValues = Array.from(monthlyExpenses.values());
    let consistencyPoints = 15; // default moderate
    if (monthlyValues.length >= 2) {
        const avg = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length;
        const cv = avg > 0 ? Math.sqrt(monthlyValues.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / monthlyValues.length) / avg : 1;
        consistencyPoints = Math.min(30, Math.max(0, (1 - cv) * 30));
    }

    const score = Math.round(savingsPoints + goalProgress + consistencyPoints);
    const savingsConsistency = Math.round(consistencyPoints / 30 * 100);

    let level: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
    if (score >= 70) level = 'conservative';
    else if (score <= 35) level = 'aggressive';

    return { score, level, savingsConsistency };
};

// ============================================
// INSIGHT GENERATION
// ============================================

const generateInsights = (
    velocity: SpendingVelocity,
    affinities: CategoryAffinity[],
    temporal: TemporalPattern,
    impulseData: { ratio: number; impulseCount: number; plannedCount: number },
    riskData: { score: number; level: string }
): string[] => {
    const insights: string[] = [];

    // Velocity insight
    if (velocity.trend === 'accelerating') {
        insights.push(`Your spending is accelerating — up ${Math.abs(velocity.trendPercentage)}% vs. last month. Consider reviewing discretionary categories.`);
    } else if (velocity.trend === 'decelerating') {
        insights.push(`Great discipline! Your spending has decreased ${Math.abs(velocity.trendPercentage)}% compared to last month.`);
    } else {
        insights.push(`Your spending velocity is stable, averaging ${velocity.dailyBurnRate.toFixed(0)} per day.`);
    }

    // Top category insight
    if (affinities.length > 0) {
        const top = affinities[0];
        insights.push(`Your #1 spending category is ${top.category} (${top.percentageOfTotal}% of total), with ${top.consistency}% consistency.`);
    }

    // Temporal insight
    insights.push(`You tend to spend the most on ${temporal.peakSpendingDay}s, with Week ${temporal.peakSpendingWeek} being your heaviest spending period of the month.`);

    // Impulse insight
    if (impulseData.ratio > 0.6) {
        insights.push(`${Math.round(impulseData.ratio * 100)}% of your transactions appear impulsive. Introducing purchase cooling-off periods could help.`);
    } else if (impulseData.ratio < 0.3) {
        insights.push(`Your spending is highly planned — only ${Math.round(impulseData.ratio * 100)}% of transactions appear impulsive. Excellent discipline!`);
    }

    // Risk insight
    if (riskData.level === 'conservative') {
        insights.push(`Your risk profile is conservative (Score: ${riskData.score}/100), indicating strong financial safety nets.`);
    } else if (riskData.level === 'aggressive') {
        insights.push(`Your risk profile is aggressive (Score: ${riskData.score}/100). Building more financial buffers is recommended.`);
    }

    return insights;
};

// ============================================
// MAIN ENGINE
// ============================================

export const generateBehavioralProfile = (
    transactions: Transaction[],
    savingsGoals: SavingsGoal[] = []
): BehavioralProfile | null => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length < 5) return null;

    // Calculate data span
    const dates = transactions.map(t => new Date(t.date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dataSpanDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));

    // Run all analysis modules
    const velocity = calculateSpendingVelocity(transactions);
    const affinities = calculateCategoryAffinities(transactions);
    const temporal = analyzeTemporalPatterns(transactions);
    const impulseData = classifyImpulseVsPlanned(transactions);
    const riskData = calculateRiskTolerance(transactions, savingsGoals);
    const insights = generateInsights(velocity, affinities, temporal, impulseData, riskData);

    return {
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        dataSpanDays,
        transactionCount: transactions.length,
        spendingVelocity: velocity,
        categoryAffinities: affinities,
        temporalPatterns: temporal,
        impulseVsPlannedRatio: impulseData.ratio,
        impulseTransactionCount: impulseData.impulseCount,
        plannedTransactionCount: impulseData.plannedCount,
        riskToleranceScore: riskData.score,
        riskLevel: riskData.level,
        savingsConsistency: riskData.savingsConsistency,
        topInsights: insights
    };
};
