import {
    Transaction,
    TransactionType,
    BehavioralProfile
} from '../types';

/**
 * Wealth Momentum Service
 * 
 * Tracks "Burn Rate" consistency, lifestyle creep, savings speed,
 * and assigns Financial Personas based on spending behavior.
 */

export type FinancialPersona = 'The Stoic Guardian' | 'The Growth Strategist' | 'The Lifestyle Enthusiast';

export interface PersonaInfo {
    name: FinancialPersona;
    icon: string; // emoji
    description: string;
    color: string;
}

export interface HeatmapCell {
    week: number; // 0-11 (12 weeks)
    dayOfWeek: number; // 0-6 (Mon-Sun)
    intensity: number; // 0-1
    amount: number;
    dateLabel: string;
}

export interface WealthMomentumData {
    heatmapGrid: HeatmapCell[];
    lifestyleCreepIndex: number; // -100 to +100 (negative = decreasing, positive = creeping up)
    savingsSpeedScore: number; // 0-100
    persona: PersonaInfo;
    weeklyBurnRates: number[]; // 12 weeks of burn rates
    averageBurnRate: number;
    burnRateTrend: 'improving' | 'stable' | 'worsening';
}

const PERSONA_DEFINITIONS: Record<FinancialPersona, Omit<PersonaInfo, 'name'>> = {
    'The Stoic Guardian': {
        icon: '🛡️',
        description: 'Disciplined and methodical. You prioritize planned spending and maintain strong savings consistency. Your financial fortress is well-guarded.',
        color: '#10b981' // emerald
    },
    'The Growth Strategist': {
        icon: '📈',
        description: 'Balanced and strategic. You blend controlled spending with calculated risks, growing wealth at a sustainable pace.',
        color: '#3b82f6' // blue
    },
    'The Lifestyle Enthusiast': {
        icon: '✨',
        description: 'Spontaneous and experience-driven. You enjoy spending on lifestyle but should watch for creeping expenses eroding your savings.',
        color: '#f59e0b' // amber
    }
};

/**
 * Determine Financial Persona from behavioral profile
 */
function classifyPersona(profile: BehavioralProfile | null): PersonaInfo {
    if (!profile) {
        return { name: 'The Growth Strategist', ...PERSONA_DEFINITIONS['The Growth Strategist'] };
    }

    const impulseRatio = profile.impulseVsPlannedRatio;
    const savingsConsistency = profile.savingsConsistency;

    if (impulseRatio < 0.25 && savingsConsistency > 70) {
        return { name: 'The Stoic Guardian', ...PERSONA_DEFINITIONS['The Stoic Guardian'] };
    } else if (impulseRatio > 0.55 || savingsConsistency < 40) {
        return { name: 'The Lifestyle Enthusiast', ...PERSONA_DEFINITIONS['The Lifestyle Enthusiast'] };
    } else {
        return { name: 'The Growth Strategist', ...PERSONA_DEFINITIONS['The Growth Strategist'] };
    }
}

/**
 * Build 12-week heatmap of daily spending intensity
 */
function buildHeatmapGrid(transactions: Transaction[]): HeatmapCell[] {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const now = new Date();

    // Find the current date at 00:00:00
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // We want the grid to end today. We need 12 weeks of data.
    // To make it look like a GitHub-style grid, we align to Monday-Sunday (or similar).
    // Let's find the Sunday of the current week to be our "end" of the grid's last week.
    const currentDay = today.getDay(); // 0=Sun, 1=Mon...
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1;

    // Start of the 12-week period (84 days ago from the upcoming/current Sunday)
    // Actually, simpler: just go back 11 full weeks plus the current week so far.
    const twelveWeeksAgo = new Date(today.getTime() - (83 + daysSinceMonday) * 24 * 60 * 60 * 1000);

    // Group spending by date
    const dailySpending = new Map<string, number>();
    expenses.forEach(t => {
        const date = t.date.split('T')[0];
        dailySpending.set(date, (dailySpending.get(date) || 0) + t.amount);
    });

    const allAmounts = Array.from(dailySpending.values());
    const maxSpend = Math.max(...allAmounts, 1);

    const cells: HeatmapCell[] = [];

    // Build grid: 12 weeks × 7 days
    for (let week = 0; week < 12; week++) {
        for (let dow = 0; dow < 7; dow++) {
            // Calculate date for this cell
            const cellDate = new Date(twelveWeeksAgo.getTime() + (week * 7 + dow) * 24 * 60 * 60 * 1000);
            const dateStr = cellDate.toISOString().split('T')[0];
            const amount = dailySpending.get(dateStr) || 0;

            cells.push({
                week,
                dayOfWeek: dow,
                intensity: maxSpend > 0 ? Math.min(1, amount / maxSpend) : 0,
                amount,
                dateLabel: cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            });
        }
    }

    return cells;
}

/**
 * Calculate Lifestyle Creep Index
 * Compares spending growth rate to income growth rate
 */
function calculateLifestyleCreep(transactions: Transaction[]): number {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const income = transactions.filter(t => t.type === TransactionType.INCOME);

    // Group by month
    const monthlyExpenses = new Map<string, number>();
    const monthlyIncome = new Map<string, number>();

    expenses.forEach(t => {
        const month = t.date.slice(0, 7);
        monthlyExpenses.set(month, (monthlyExpenses.get(month) || 0) + t.amount);
    });

    income.forEach(t => {
        const month = t.date.slice(0, 7);
        monthlyIncome.set(month, (monthlyIncome.get(month) || 0) + t.amount);
    });

    const expenseMonths = Array.from(monthlyExpenses.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const incomeMonths = Array.from(monthlyIncome.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    if (expenseMonths.length < 2) return 0;

    // Calculate average growth rates
    let expenseGrowth = 0;
    for (let i = 1; i < expenseMonths.length; i++) {
        if (expenseMonths[i - 1][1] > 0) {
            expenseGrowth += (expenseMonths[i][1] - expenseMonths[i - 1][1]) / expenseMonths[i - 1][1];
        }
    }
    expenseGrowth /= Math.max(1, expenseMonths.length - 1);

    let incomeGrowth = 0;
    if (incomeMonths.length >= 2) {
        let count = 0;
        for (let i = 1; i < incomeMonths.length; i++) {
            if (incomeMonths[i - 1][1] > 0) {
                incomeGrowth += (incomeMonths[i][1] - incomeMonths[i - 1][1]) / incomeMonths[i - 1][1];
                count++;
            }
        }
        if (count > 0) incomeGrowth /= count;
    }

    // Lifestyle creep = spending growth outpacing income growth
    const creep = (expenseGrowth - incomeGrowth) * 100;
    return Math.max(-100, Math.min(100, Math.round(creep * 10) / 10));
}

/**
 * Calculate Savings Speed Score (0-100)
 */
function calculateSavingsSpeed(transactions: Transaction[]): number {
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    if (totalIncome === 0) return 0;

    const savingsRate = (totalIncome - totalExpense) / totalIncome;

    // 30%+ savings rate = 100 score, 0% = 0, negative = 0
    return Math.max(0, Math.min(100, Math.round(savingsRate / 0.30 * 100)));
}

/**
 * Calculate weekly burn rates for the last 12 weeks
 */
function calculateWeeklyBurnRates(transactions: Transaction[]): number[] {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const now = new Date();
    const rates: number[] = [];

    for (let week = 0; week < 12; week++) {
        const weekEnd = new Date(now.getTime() - week * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weekExpenses = expenses.filter(t => {
            const d = new Date(t.date).getTime();
            return d >= weekStart.getTime() && d < weekEnd.getTime();
        });

        rates.unshift(weekExpenses.reduce((sum, t) => sum + t.amount, 0));
    }

    return rates;
}

/**
 * Main entry — calculate full Wealth Momentum data
 */
export function calculateWealthMomentum(
    transactions: Transaction[],
    behavioralProfile: BehavioralProfile | null
): WealthMomentumData {
    const heatmapGrid = buildHeatmapGrid(transactions);
    const lifestyleCreepIndex = calculateLifestyleCreep(transactions);
    const savingsSpeedScore = calculateSavingsSpeed(transactions);
    const persona = classifyPersona(behavioralProfile);
    const weeklyBurnRates = calculateWeeklyBurnRates(transactions);

    const averageBurnRate = weeklyBurnRates.length > 0
        ? weeklyBurnRates.reduce((a, b) => a + b, 0) / weeklyBurnRates.length
        : 0;

    // Determine burn rate trend from last 4 weeks vs previous 4
    const recent4 = weeklyBurnRates.slice(-4);
    const previous4 = weeklyBurnRates.slice(-8, -4);

    const recentAvg = recent4.reduce((a, b) => a + b, 0) / Math.max(1, recent4.length);
    const prevAvg = previous4.reduce((a, b) => a + b, 0) / Math.max(1, previous4.length);

    let burnRateTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (prevAvg > 0) {
        const change = (recentAvg - prevAvg) / prevAvg;
        if (change > 0.1) burnRateTrend = 'worsening';
        else if (change < -0.1) burnRateTrend = 'improving';
    }

    return {
        heatmapGrid,
        lifestyleCreepIndex,
        savingsSpeedScore,
        persona,
        weeklyBurnRates,
        averageBurnRate: Math.round(averageBurnRate * 100) / 100,
        burnRateTrend
    };
}
