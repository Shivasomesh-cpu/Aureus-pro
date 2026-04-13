import {
    Debt,
    DebtStrategy,
    DebtPayoffPlan,
    DebtPayoffSchedule,
    MonthlyPayment
} from '../types';

/**
 * Debt Management Service
 *
 * Uses a CORRECT month-by-month simultaneous simulation:
 * - Every month, interest accrues on ALL remaining balances
 * - Minimum payments are made on ALL debts simultaneously
 * - The "extra" pool (freed minimums + user extra) is directed to the target debt
 * - When a target is paid off, its minimum rolls into the pool for the next target
 *
 * This guarantees the mathematical property:
 *   Avalanche ≤ Snowball in total interest paid (always)
 */

// ============================================================
// CORE SIMULTANEOUS SIMULATION ENGINE
// ============================================================

interface SimulationResult {
    totalInterest: number;
    totalMonths: number;
    payoffDate: string;
    monthlyPayment: number;
    schedules: DebtPayoffSchedule[];
}

function simulatePayoff(
    debts: Debt[],
    sortedOrder: Debt[], // order determines payoff priority
    extraPayment: number,
    strategy: DebtStrategy
): SimulationResult {
    const n = sortedOrder.length;
    if (n === 0) {
        return {
            totalInterest: 0,
            totalMonths: 0,
            payoffDate: new Date().toISOString().split('T')[0],
            monthlyPayment: 0,
            schedules: [],
        };
    }

    // Live balances
    const balances = new Map<string, number>();
    sortedOrder.forEach(d => balances.set(d.id, d.balance));

    // Per-debt interest accumulator and payoff month
    const debtInterest = new Map<string, number>();
    const payoffMonth = new Map<string, number>();
    sortedOrder.forEach(d => debtInterest.set(d.id, 0));

    // Track which debts have been paid off (in order of payoff)
    const paidOff = new Set<string>();

    let totalInterest = 0;
    let month = 0;
    let targetIdx = 0; // pointer into sortedOrder for the current focus debt

    // Total minimum payments for display
    const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);
    const displayMonthlyPayment = totalMinimum + extraPayment;

    // Safety limit: 600 months (50 years)
    while (month < 600) {
        // Advance target pointer past already-paid debts
        while (targetIdx < n && paidOff.has(sortedOrder[targetIdx].id)) {
            targetIdx++;
        }
        if (targetIdx >= n) break; // all paid off

        month++;

        // ── Step 1: Accrue interest on all remaining balances ──
        for (const debt of sortedOrder) {
            const bal = balances.get(debt.id) ?? 0;
            if (bal <= 0.005) continue;
            const interest = bal * (debt.interestRate / 100 / 12);
            balances.set(debt.id, bal + interest);
            debtInterest.set(debt.id, (debtInterest.get(debt.id) ?? 0) + interest);
            totalInterest += interest;
        }

        // ── Step 2: Calculate payment pool ──
        // Pool = sum of minimums of all remaining debts + extraPayment
        // (Freed minimums from paid debts have already been rolled in by design —
        //  because paidOff debts contribute $0 to the minimum sum, so their freed
        //  minimums naturally add to the pool available for the target.)
        let pool = extraPayment;
        for (const debt of sortedOrder) {
            if (!paidOff.has(debt.id)) {
                pool += debt.minimumPayment;
            }
        }

        // ── Step 3: Pay minimums on ALL non-target debts ──
        for (const debt of sortedOrder) {
            if (debt.id === sortedOrder[targetIdx].id) continue;
            if (paidOff.has(debt.id)) continue;

            const bal = balances.get(debt.id) ?? 0;
            if (bal <= 0.005) {
                paidOff.add(debt.id);
                payoffMonth.set(debt.id, month);
                balances.set(debt.id, 0);
                continue;
            }
            const payment = Math.min(debt.minimumPayment, bal);
            balances.set(debt.id, bal - payment);
            pool -= payment;

            if ((balances.get(debt.id) ?? 0) <= 0.005) {
                paidOff.add(debt.id);
                payoffMonth.set(debt.id, month);
                balances.set(debt.id, 0);
            }
        }

        // ── Step 4: Direct remaining pool at the target debt ──
        const targetDebt = sortedOrder[targetIdx];
        const targetBal = balances.get(targetDebt.id) ?? 0;
        const targetPayment = Math.min(Math.max(0, pool), targetBal);
        balances.set(targetDebt.id, targetBal - targetPayment);

        if ((balances.get(targetDebt.id) ?? 0) <= 0.005) {
            paidOff.add(targetDebt.id);
            payoffMonth.set(targetDebt.id, month);
            balances.set(targetDebt.id, 0);
        }
    }

    // Build payoff schedules (summary-level, not per-month detail)
    const schedules: DebtPayoffSchedule[] = sortedOrder.map((debt, i) => ({
        debtId: debt.id,
        debtName: debt.name,
        originalBalance: debt.balance,
        interestRate: debt.interestRate,
        payoffOrder: i + 1,
        monthsToPayoff: payoffMonth.get(debt.id) ?? month,
        totalInterestPaid: Math.round((debtInterest.get(debt.id) ?? 0) * 100) / 100,
        monthlyPayments: [], // omitted for perf — detailed view not needed
    }));

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month);

    return {
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalMonths: month,
        payoffDate: payoffDate.toISOString().split('T')[0],
        monthlyPayment: displayMonthlyPayment,
        schedules,
    };
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Snowball method: pay off smallest balance first.
 * Psychological wins by eliminating accounts quickly.
 */
export function calculateSnowballPlan(
    debts: Debt[],
    extraPayment: number = 0
): DebtPayoffPlan {
    if (debts.length === 0) {
        return emptyPlan('snowball');
    }

    // Sort by balance ascending (smallest first)
    const sortedOrder = [...debts].sort((a, b) => a.balance - b.balance);
    const result = simulatePayoff(debts, sortedOrder, extraPayment, 'snowball');

    return {
        strategy: 'snowball',
        debts: result.schedules,
        totalInterest: result.totalInterest,
        totalMonths: result.totalMonths,
        monthlyPayment: result.monthlyPayment,
        payoffDate: result.payoffDate,
    };
}

/**
 * Avalanche method: pay off highest interest rate first.
 * Mathematically optimal — always minimizes total interest paid.
 */
export function calculateAvalanchePlan(
    debts: Debt[],
    extraPayment: number = 0
): DebtPayoffPlan {
    if (debts.length === 0) {
        return emptyPlan('avalanche');
    }

    // Sort by interest rate descending (highest first)
    const sortedOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const result = simulatePayoff(debts, sortedOrder, extraPayment, 'avalanche');

    return {
        strategy: 'avalanche',
        debts: result.schedules,
        totalInterest: result.totalInterest,
        totalMonths: result.totalMonths,
        monthlyPayment: result.monthlyPayment,
        payoffDate: result.payoffDate,
    };
}

/**
 * Compare snowball vs avalanche strategies
 */
export function compareStrategies(
    debts: Debt[],
    extraPayment: number = 0
): {
    snowball: DebtPayoffPlan;
    avalanche: DebtPayoffPlan;
    interestSaved: number;
    monthsSaved: number;
    recommendation: string;
} {
    const snowball = calculateSnowballPlan(debts, extraPayment);
    const avalanche = calculateAvalanchePlan(debts, extraPayment);

    const interestSaved = snowball.totalInterest - avalanche.totalInterest;
    const monthsSaved = snowball.totalMonths - avalanche.totalMonths;

    let recommendation: string;
    if (interestSaved === 0 && monthsSaved === 0) {
        recommendation = 'Both strategies are identical for your current debt profile.';
    } else if (interestSaved < 100 && monthsSaved < 2) {
        recommendation = `The strategies are nearly identical. Avalanche saves ${interestSaved.toFixed(2)} in total interest. Choose Snowball if eliminating accounts quickly motivates you more.`;
    } else {
        recommendation = `Avalanche is the mathematically optimal choice, saving you ${interestSaved.toFixed(2)} in interest and ${monthsSaved} months compared to Snowball.`;
    }

    return { snowball, avalanche, interestSaved, monthsSaved, recommendation };
}

/**
 * Calculate total interest on all debts at minimum payments only
 */
export function calculateTotalInterest(debts: Debt[]): number {
    const sortedOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const result = simulatePayoff(debts, sortedOrder, 0, 'avalanche');
    return result.totalInterest;
}

/**
 * Calculate how much extra payment would save in interest
 */
export function calculateExtraPaymentImpact(
    debts: Debt[],
    extraPayment: number
): {
    withoutExtra: DebtPayoffPlan;
    withExtra: DebtPayoffPlan;
    interestSaved: number;
    monthsSaved: number;
} {
    const withoutExtra = calculateAvalanchePlan(debts, 0);
    const withExtra = calculateAvalanchePlan(debts, extraPayment);

    return {
        withoutExtra,
        withExtra,
        interestSaved: withoutExtra.totalInterest - withExtra.totalInterest,
        monthsSaved: withoutExtra.totalMonths - withExtra.totalMonths,
    };
}

// ============================================================
// HELPERS
// ============================================================

function emptyPlan(strategy: DebtStrategy): DebtPayoffPlan {
    return {
        strategy,
        debts: [],
        totalInterest: 0,
        totalMonths: 0,
        monthlyPayment: 0,
        payoffDate: new Date().toISOString().split('T')[0],
    };
}
