import {
    Transaction,
    TransactionType,
    Budget,
    SavingsGoal,
    Debt,
    FinancialHealthScore,
    BehavioralProfile,
    Category
} from '../types';

/**
 * The Life Architect — AI-Driven Scenario Goal Optimizer
 * 
 * Uses Monte Carlo simulation to calculate probability of reaching
 * financial goals and generates 3 optimized paths (Accelerated, Balanced, Sustainable).
 */

// ============================================
// TYPES
// ============================================

export interface LifeGoal {
    description: string;
    targetAmount: number;
    timeframeMonths: number;
    type: 'house' | 'savings' | 'sabbatical' | 'education' | 'retirement' | 'custom';
}

export type PathType = 'accelerated' | 'balanced' | 'sustainable';

export interface OptimizedPath {
    type: PathType;
    icon: string;
    label: string;
    description: string;
    probability: number; // 0-100
    timelineMonths: number;
    monthlySavingsRequired: number;
    categoryAdjustments: CategoryAdjustment[];
    monthlyDisposableAfter: number;
    healthScoreImpact: number; // delta from current
    burnoutRisk: 'low' | 'moderate' | 'high';
}

export interface CategoryAdjustment {
    category: Category;
    currentMonthly: number;
    suggestedMonthly: number;
    changePercent: number;
}

export interface MonteCarloResult {
    meanOutcome: number;
    medianOutcome: number;
    p10: number; // 10th percentile (pessimistic)
    p90: number; // 90th percentile (optimistic)
    probabilityOfSuccess: number;
    simulations: number;
}

export interface LifeArchitectResult {
    goal: LifeGoal;
    currentMonthlySavings: number;
    currentMonthlyIncome: number;
    currentMonthlyExpenses: number;
    monteCarlo: MonteCarloResult;
    paths: OptimizedPath[];
    persona: string | null;
    currentHealthScore: number;
}

// ============================================
// PRESET GOALS
// ============================================

export interface PresetGoal {
    label: string;
    icon: string;
    type: LifeGoal['type'];
    defaultDescription: string;
    targetMultiplier: number; // multiply by monthly income
    defaultMonths: number;
}

export const PRESET_GOALS: PresetGoal[] = [
    { label: 'Dream Home', icon: '🏠', type: 'house', defaultDescription: 'Save for a house down payment (20%)', targetMultiplier: 18, defaultMonths: 36 },
    { label: 'Emergency Fund', icon: '🛡️', type: 'savings', defaultDescription: 'Build 6-month emergency fund', targetMultiplier: 6, defaultMonths: 18 },
    { label: 'Sabbatical', icon: '🌴', type: 'sabbatical', defaultDescription: '3-month unpaid sabbatical fund', targetMultiplier: 4, defaultMonths: 24 },
    { label: 'Education', icon: '🎓', type: 'education', defaultDescription: 'Fund education or certification', targetMultiplier: 6, defaultMonths: 24 },
    { label: 'Early Retirement', icon: '🏖️', type: 'retirement', defaultDescription: 'Accelerate retirement savings', targetMultiplier: 60, defaultMonths: 120 },
];

// ============================================
// FINANCIAL ANALYSIS
// ============================================

interface FinancialSnapshot {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    categorySpending: Map<Category, number>;
    spendingVolatility: number; // coefficient of variation
    essentialSpending: number;
    discretionarySpending: number;
}

const ESSENTIAL_CATEGORIES: Category[] = ['Housing', 'Utilities', 'Food', 'Transportation', 'Healthcare'];
const DISCRETIONARY_CATEGORIES: Category[] = ['Shopping', 'Entertainment', 'Travel', 'Education', 'Other'];

function analyzeFinancials(transactions: Transaction[]): FinancialSnapshot {
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const dates = transactions.map(t => new Date(t.date).getTime());
    const monthSpan = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24 * 30));

    const totalIncome = income.reduce((s, t) => s + t.amount, 0);
    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
    const monthlyIncome = totalIncome / monthSpan;
    const monthlyExpenses = totalExpense / monthSpan;

    // Category breakdown
    const categorySpending = new Map<Category, number>();
    expenses.forEach(t => {
        categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount / monthSpan);
    });

    // Monthly totals for volatility
    const monthlyTotals = new Map<string, number>();
    expenses.forEach(t => {
        const month = t.date.slice(0, 7);
        monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + t.amount);
    });
    const totals = Array.from(monthlyTotals.values());
    const avgMonthly = totals.reduce((a, b) => a + b, 0) / Math.max(1, totals.length);
    const variance = totals.reduce((s, v) => s + Math.pow(v - avgMonthly, 2), 0) / Math.max(1, totals.length);
    const volatility = avgMonthly > 0 ? Math.sqrt(variance) / avgMonthly : 0.2;

    let essentialSpending = 0;
    let discretionarySpending = 0;
    categorySpending.forEach((amount, category) => {
        if (ESSENTIAL_CATEGORIES.includes(category)) essentialSpending += amount;
        else discretionarySpending += amount;
    });

    return {
        monthlyIncome,
        monthlyExpenses,
        monthlySavings: monthlyIncome - monthlyExpenses,
        categorySpending,
        spendingVolatility: volatility,
        essentialSpending,
        discretionarySpending,
    };
}

// ============================================
// MONTE CARLO SIMULATION
// ============================================

/**
 * Box-Muller transform for normal distribution
 * Returns a value with mean 0 and stddev 1
 */
function normalRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function runMonteCarlo(
    monthlySavings: number,
    volatility: number,
    timeframeMonths: number,
    targetAmount: number,
    existingSavings: number,
    numSimulations: number = 1000
): MonteCarloResult {
    const outcomes: number[] = [];
    let successes = 0;

    // Ensure meaningful spread: minimum 25% effective volatility
    const effectiveVolatility = Math.max(0.25, volatility);

    for (let sim = 0; sim < numSimulations; sim++) {
        let accumulated = existingSavings;
        // Each simulation gets a slight "life trajectory" shift (some people do better, some worse)
        const lifeFactor = 1 + normalRandom() * 0.15; // ±15% life trajectory variance

        for (let month = 0; month < timeframeMonths; month++) {
            // Monthly savings vary with normal distribution
            const monthlyNoise = 1 + normalRandom() * effectiveVolatility * 0.5;
            const monthlySaving = monthlySavings * lifeFactor * Math.max(0, monthlyNoise);

            // Unexpected expenses: 10% chance per month, scaled to savings
            let unexpectedExpense = 0;
            if (Math.random() < 0.10) {
                // Shock ranges from 50% to 200% of monthly savings
                unexpectedExpense = Math.abs(monthlySavings) * (0.5 + Math.random() * 1.5);
            }

            // Rare major life event: 1% chance per month (car repair, medical, etc.)
            if (Math.random() < 0.01) {
                unexpectedExpense += Math.abs(monthlySavings) * (2 + Math.random() * 4);
            }

            // Income variability: ±8% random fluctuation
            const incomeAdjust = 1 + normalRandom() * 0.08;
            accumulated += (monthlySaving * incomeAdjust) - unexpectedExpense;

            // Small investment growth (0.3% monthly ≈ 3.7% annually) with variance
            const growthRate = 1.003 + normalRandom() * 0.002;
            accumulated *= Math.max(0.99, growthRate);

            // Floor: savings can't go below 0
            accumulated = Math.max(0, accumulated);
        }
        outcomes.push(accumulated);
        if (accumulated >= targetAmount) successes++;
    }

    outcomes.sort((a, b) => a - b);

    return {
        meanOutcome: outcomes.reduce((a, b) => a + b, 0) / numSimulations,
        medianOutcome: outcomes[Math.floor(numSimulations / 2)],
        p10: outcomes[Math.floor(numSimulations * 0.1)],
        p90: outcomes[Math.floor(numSimulations * 0.9)],
        probabilityOfSuccess: Math.round((successes / numSimulations) * 100),
        simulations: numSimulations,
    };
}


// ============================================
// PATH GENERATION
// ============================================

function generatePaths(
    snapshot: FinancialSnapshot,
    goal: LifeGoal,
    existingSavings: number,
    currentHealthScore: number,
    persona: string | null
): OptimizedPath[] {
    const remaining = Math.max(0, goal.targetAmount - existingSavings);
    const baseRequired = remaining / Math.max(1, goal.timeframeMonths);

    const paths: OptimizedPath[] = [];

    // ---- ACCELERATED PATH ----
    const accelCutPercent = 0.40; // Cut 40% of discretionary
    const accelSavings = snapshot.monthlySavings + (snapshot.discretionarySpending * accelCutPercent);
    const accelMonths = accelSavings > 0 ? Math.ceil(remaining / accelSavings) : 999;
    const accelAdjustments = generateAdjustments(snapshot.categorySpending, accelCutPercent, 0.05);

    paths.push({
        type: 'accelerated',
        icon: '🚀',
        label: 'Accelerated',
        description: 'Aggressive cuts in discretionary spending to hit the goal early. Maximum savings velocity.',
        probability: 0, // calculated below
        timelineMonths: Math.min(accelMonths, goal.timeframeMonths),
        monthlySavingsRequired: Math.round(accelSavings),
        categoryAdjustments: accelAdjustments,
        monthlyDisposableAfter: Math.round(snapshot.monthlyIncome - snapshot.essentialSpending - (snapshot.discretionarySpending * (1 - accelCutPercent)) - accelSavings),
        healthScoreImpact: Math.min(15, Math.round(accelCutPercent * 30)),
        burnoutRisk: persona === 'The Lifestyle Enthusiast' ? 'high' : 'moderate',
    });

    // ---- BALANCED PATH ----
    const balancedCutPercent = 0.20; // Cut 20% of discretionary
    const balancedSavings = snapshot.monthlySavings + (snapshot.discretionarySpending * balancedCutPercent);
    const balancedMonths = balancedSavings > 0 ? Math.ceil(remaining / balancedSavings) : 999;
    const balancedAdjustments = generateAdjustments(snapshot.categorySpending, balancedCutPercent, 0.02);

    paths.push({
        type: 'balanced',
        icon: '⚖️',
        label: 'Balanced',
        description: 'Moderate adjustments that maintain lifestyle quality while making meaningful progress toward your goal.',
        probability: 0,
        timelineMonths: Math.min(balancedMonths, goal.timeframeMonths),
        monthlySavingsRequired: Math.round(balancedSavings),
        categoryAdjustments: balancedAdjustments,
        monthlyDisposableAfter: Math.round(snapshot.monthlyIncome - snapshot.essentialSpending - (snapshot.discretionarySpending * (1 - balancedCutPercent)) - balancedSavings),
        healthScoreImpact: Math.min(8, Math.round(balancedCutPercent * 25)),
        burnoutRisk: 'low',
    });

    // ---- SUSTAINABLE PATH ----
    const sustainCutPercent = 0.10; // Cut 10% of discretionary
    const sustainSavings = snapshot.monthlySavings + (snapshot.discretionarySpending * sustainCutPercent);
    const sustainMonths = sustainSavings > 0 ? Math.ceil(remaining / sustainSavings) : 999;
    const sustainAdjustments = generateAdjustments(snapshot.categorySpending, sustainCutPercent, 0.00);

    paths.push({
        type: 'sustainable',
        icon: '🐢',
        label: 'Sustainable',
        description: 'Small, consistent changes that prioritize mental wellness over speed. Low impact on daily life.',
        probability: 0,
        timelineMonths: Math.min(sustainMonths, goal.timeframeMonths),
        monthlySavingsRequired: Math.round(sustainSavings),
        categoryAdjustments: sustainAdjustments,
        monthlyDisposableAfter: Math.round(snapshot.monthlyIncome - snapshot.essentialSpending - (snapshot.discretionarySpending * (1 - sustainCutPercent)) - sustainSavings),
        healthScoreImpact: Math.min(4, Math.round(sustainCutPercent * 20)),
        burnoutRisk: 'low',
    });

    // Run Monte Carlo for each path
    paths.forEach(path => {
        const mc = runMonteCarlo(
            path.monthlySavingsRequired,
            snapshot.spendingVolatility,
            path.timelineMonths,
            goal.targetAmount,
            existingSavings,
            500
        );
        path.probability = mc.probabilityOfSuccess;
    });

    return paths;
}

function generateAdjustments(
    categorySpending: Map<Category, number>,
    discretionaryCutPercent: number,
    essentialCutPercent: number
): CategoryAdjustment[] {
    const adjustments: CategoryAdjustment[] = [];

    categorySpending.forEach((monthly, category) => {
        if (monthly <= 0) return;
        const isEssential = ESSENTIAL_CATEGORIES.includes(category);
        const cutPercent = isEssential ? essentialCutPercent : discretionaryCutPercent;
        const suggested = Math.round(monthly * (1 - cutPercent));

        if (cutPercent > 0) {
            adjustments.push({
                category,
                currentMonthly: Math.round(monthly),
                suggestedMonthly: suggested,
                changePercent: -Math.round(cutPercent * 100),
            });
        }
    });

    return adjustments.sort((a, b) => a.changePercent - b.changePercent);
}

// ============================================
// MAIN ENTRY
// ============================================

export function runLifeArchitect(
    goal: LifeGoal,
    transactions: Transaction[],
    savingsGoals: SavingsGoal[],
    debts: Debt[],
    healthScore: FinancialHealthScore | null,
    behavioralProfile: BehavioralProfile | null
): LifeArchitectResult {
    const snapshot = analyzeFinancials(transactions);

    // Start from $0 — this is a NEW goal the user is planning for
    // Existing savings goals are separate targets, not funds for this new goal
    const existingSavings = 0;

    const persona = behavioralProfile ? classifyPersona(behavioralProfile) : null;
    const currentScore = healthScore?.overallScore ?? 50;

    // Monte Carlo with current savings rate
    const baseMonteCarlo = runMonteCarlo(
        snapshot.monthlySavings,
        snapshot.spendingVolatility,
        goal.timeframeMonths,
        goal.targetAmount,
        existingSavings,
        1000
    );

    const paths = generatePaths(snapshot, goal, existingSavings, currentScore, persona);

    return {
        goal,
        currentMonthlySavings: Math.round(snapshot.monthlySavings),
        currentMonthlyIncome: Math.round(snapshot.monthlyIncome),
        currentMonthlyExpenses: Math.round(snapshot.monthlyExpenses),
        monteCarlo: baseMonteCarlo,
        paths,
        persona,
        currentHealthScore: currentScore,
    };
}

function classifyPersona(profile: BehavioralProfile): string {
    if (profile.impulseVsPlannedRatio < 0.25 && profile.savingsConsistency > 70) return 'The Stoic Guardian';
    if (profile.impulseVsPlannedRatio > 0.55 || profile.savingsConsistency < 40) return 'The Lifestyle Enthusiast';
    return 'The Growth Strategist';
}

/**
 * Generate a goal from a preset
 */
export function createGoalFromPreset(preset: PresetGoal, monthlyIncome: number): LifeGoal {
    return {
        description: preset.defaultDescription,
        targetAmount: Math.round(monthlyIncome * preset.targetMultiplier),
        timeframeMonths: preset.defaultMonths,
        type: preset.type,
    };
}
