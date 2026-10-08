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
 * Uses an exact month-by-month simultaneous simulation:
 * - Every month, interest accrues on ALL remaining balances
 * - Minimum payments are made on ALL debts simultaneously
 * - The "extra" pool (freed minimums + user extra + optional windfall) is directed to the target debt
 * - When a target is paid off, its minimum rolls into the pool for the next target
 * - Computes complete month-by-month amortization timeline for chart visualization
 * - Supports dynamic "Windfall Injection" (bonus applied in month X)
 */

export interface WindfallInjection {
    amount: number;
    month: number; // 1-indexed (e.g. Month 3 or Month 6)
}

export interface AmortizationPoint {
    month: number;
    totalBalance: number;
    interestPaid: number;
    principalPaid: number;
    debtBalances: Record<string, number>;
}

interface SimulationResult {
    totalInterest: number;
    totalMonths: number;
    payoffPossible: boolean;
    payoffDate: string;
    monthlyPayment: number;
    schedules: DebtPayoffSchedule[];
    trajectory: { month: number; totalBalance: number; interestPaid: number; principalPaid: number }[];
    fullAmortization: AmortizationPoint[];
}

function simulatePayoff(
    debts: Debt[],
    sortedOrder: Debt[], // order determines payoff priority
    extraPayment: number,
    strategy: DebtStrategy,
    windfall?: WindfallInjection
): SimulationResult {
    const n = sortedOrder.length;
    if (n === 0) {
        return {
            totalInterest: 0,
            totalMonths: 0,
            payoffPossible: true,
            payoffDate: new Date().toISOString().split('T')[0],
            monthlyPayment: 0,
            schedules: [],
            trajectory: [],
            fullAmortization: [],
        };
    }

    // Live balances
    const balances = new Map<string, number>();
    sortedOrder.forEach(d => balances.set(d.id, d.balance));

    // Per-debt interest accumulator, payoff month, and monthly payments log
    const debtInterest = new Map<string, number>();
    const payoffMonth = new Map<string, number>();
    const debtMonthlyPayments = new Map<string, MonthlyPayment[]>();
    sortedOrder.forEach(d => {
        debtInterest.set(d.id, 0);
        debtMonthlyPayments.set(d.id, []);
    });

    const trajectory: { month: number; totalBalance: number; interestPaid: number; principalPaid: number }[] = [];
    const fullAmortization: AmortizationPoint[] = [];

    // Track which debts have been paid off
    const paidOff = new Set<string>();

    let totalInterest = 0;
    let month = 0;
    let targetIdx = 0;

    const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);
    const displayMonthlyPayment = totalMinimum + extraPayment;

    // Initial Month 0 state for trajectory charts
    const initialTotal = debts.reduce((sum, d) => sum + d.balance, 0);
    trajectory.push({
        month: 0,
        totalBalance: Math.round(initialTotal * 100) / 100,
        interestPaid: 0,
        principalPaid: 0,
    });

    // Safety limit: 600 months (50 years)
    while (month < 600) {
        while (targetIdx < n && paidOff.has(sortedOrder[targetIdx].id)) {
            targetIdx++;
        }
        if (targetIdx >= n) break; // all paid off

        month++;

        let monthTotalInterest = 0;
        let monthTotalPrincipal = 0;
        const currentMonthDebtsPayment = new Map<string, { payment: number; principal: number; interest: number }>();
        sortedOrder.forEach(d => currentMonthDebtsPayment.set(d.id, { payment: 0, principal: 0, interest: 0 }));

        // ── Step 1: Accrue interest on all remaining balances ──
        for (const debt of sortedOrder) {
            const bal = balances.get(debt.id) ?? 0;
            if (bal <= 0.005) continue;
            const interest = bal * (debt.interestRate / 100 / 12);
            balances.set(debt.id, bal + interest);
            debtInterest.set(debt.id, (debtInterest.get(debt.id) ?? 0) + interest);
            totalInterest += interest;
            monthTotalInterest += interest;
            const cur = currentMonthDebtsPayment.get(debt.id)!;
            cur.interest = interest;
        }

        // ── Step 2: Calculate payment pool ──
        let pool = extraPayment;

        // Apply windfall bonus if active this month
        if (windfall && windfall.amount > 0 && windfall.month === month) {
            pool += windfall.amount;
        }

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
            const cur = currentMonthDebtsPayment.get(debt.id)!;
            cur.payment += payment;
            const principal = Math.max(0, payment - cur.interest);
            cur.principal += principal;
            monthTotalPrincipal += principal;

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

        const targetCur = currentMonthDebtsPayment.get(targetDebt.id)!;
        targetCur.payment += targetPayment;
        const targetPrincipal = Math.max(0, targetPayment - targetCur.interest);
        targetCur.principal += targetPrincipal;
        monthTotalPrincipal += targetPrincipal;

        balances.set(targetDebt.id, targetBal - targetPayment);

        if ((balances.get(targetDebt.id) ?? 0) <= 0.005) {
            paidOff.add(targetDebt.id);
            payoffMonth.set(targetDebt.id, month);
            balances.set(targetDebt.id, 0);
        }

        // Record per-debt monthly payment log
        const perDebtSnapshot: Record<string, number> = {};
        for (const debt of sortedOrder) {
            const bal = Math.max(0, balances.get(debt.id) ?? 0);
            perDebtSnapshot[debt.id] = Math.round(bal * 100) / 100;
            const p = currentMonthDebtsPayment.get(debt.id)!;
            debtMonthlyPayments.get(debt.id)!.push({
                month,
                payment: Math.round(p.payment * 100) / 100,
                principal: Math.round(p.principal * 100) / 100,
                interest: Math.round(p.interest * 100) / 100,
                remainingBalance: Math.round(bal * 100) / 100,
            });
        }

        // Calculate total remaining balance across all debts
        let currentTotalBalance = 0;
        for (const bal of balances.values()) {
            currentTotalBalance += Math.max(0, bal);
        }

        trajectory.push({
            month,
            totalBalance: Math.round(currentTotalBalance * 100) / 100,
            interestPaid: Math.round(monthTotalInterest * 100) / 100,
            principalPaid: Math.round(monthTotalPrincipal * 100) / 100,
        });

        fullAmortization.push({
            month,
            totalBalance: Math.round(currentTotalBalance * 100) / 100,
            interestPaid: Math.round(monthTotalInterest * 100) / 100,
            principalPaid: Math.round(monthTotalPrincipal * 100) / 100,
            debtBalances: perDebtSnapshot,
        });
    }

    const schedules: DebtPayoffSchedule[] = sortedOrder.map((debt, i) => ({
        debtId: debt.id,
        debtName: debt.name,
        originalBalance: debt.balance,
        interestRate: debt.interestRate,
        payoffOrder: i + 1,
        monthsToPayoff: payoffMonth.get(debt.id) ?? month,
        totalInterestPaid: Math.round((debtInterest.get(debt.id) ?? 0) * 100) / 100,
        monthlyPayments: debtMonthlyPayments.get(debt.id) || [],
    }));

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month);

    return {
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalMonths: month,
        payoffPossible: paidOff.size === n,
        payoffDate: payoffDate.toISOString().split('T')[0],
        monthlyPayment: displayMonthlyPayment,
        schedules,
        trajectory,
        fullAmortization,
    };
}

// ============================================================
// PUBLIC API
// ============================================================

export function calculateSnowballPlan(
    debts: Debt[],
    extraPayment: number = 0,
    windfall?: WindfallInjection
): DebtPayoffPlan {
    if (debts.length === 0) {
        return emptyPlan('snowball');
    }

    const sortedOrder = [...debts].sort((a, b) => a.balance - b.balance);
    const result = simulatePayoff(debts, sortedOrder, extraPayment, 'snowball', windfall);

    return {
        strategy: 'snowball',
        debts: result.schedules,
        totalInterest: result.totalInterest,
        totalMonths: result.totalMonths,
        payoffPossible: result.payoffPossible,
        monthlyPayment: result.monthlyPayment,
        payoffDate: result.payoffDate,
        trajectory: result.trajectory,
        windfall,
    };
}

export function calculateAvalanchePlan(
    debts: Debt[],
    extraPayment: number = 0,
    windfall?: WindfallInjection
): DebtPayoffPlan {
    if (debts.length === 0) {
        return emptyPlan('avalanche');
    }

    const sortedOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const result = simulatePayoff(debts, sortedOrder, extraPayment, 'avalanche', windfall);

    return {
        strategy: 'avalanche',
        debts: result.schedules,
        totalInterest: result.totalInterest,
        totalMonths: result.totalMonths,
        payoffPossible: result.payoffPossible,
        monthlyPayment: result.monthlyPayment,
        payoffDate: result.payoffDate,
        trajectory: result.trajectory,
        windfall,
    };
}

export interface TrajectoryComparisonPoint {
    month: number;
    snowballBalance: number;
    avalancheBalance: number;
}

export function compareStrategies(
    debts: Debt[],
    extraPayment: number = 0,
    windfall?: WindfallInjection
): {
    snowball: DebtPayoffPlan;
    avalanche: DebtPayoffPlan;
    interestSaved: number;
    monthsSaved: number;
    recommendation: string;
    trajectoryComparison: TrajectoryComparisonPoint[];
    windfallImpact?: {
        interestSaved: number;
        monthsSaved: number;
    };
} {
    const snowball = calculateSnowballPlan(debts, extraPayment, windfall);
    const avalanche = calculateAvalanchePlan(debts, extraPayment, windfall);

    const interestSaved = Math.max(0, Math.round((snowball.totalInterest - avalanche.totalInterest) * 100) / 100);
    const monthsSaved = Math.max(0, snowball.totalMonths - avalanche.totalMonths);

    // Build side-by-side trajectory chart points
    const maxMonths = Math.max(snowball.totalMonths, avalanche.totalMonths);
    const trajectoryComparison: TrajectoryComparisonPoint[] = [];

    const snowMap = new Map<number, number>();
    snowball.trajectory?.forEach(t => snowMap.set(t.month, t.totalBalance));

    const avaMap = new Map<number, number>();
    avalanche.trajectory?.forEach(t => avaMap.set(t.month, t.totalBalance));

    for (let m = 0; m <= maxMonths; m++) {
        trajectoryComparison.push({
            month: m,
            snowballBalance: snowMap.has(m) ? snowMap.get(m)! : 0,
            avalancheBalance: avaMap.has(m) ? avaMap.get(m)! : 0,
        });
    }

    // Optional windfall calculation
    let windfallImpact: { interestSaved: number; monthsSaved: number } | undefined;
    if (windfall && windfall.amount > 0) {
        const avalancheWithoutWindfall = calculateAvalanchePlan(debts, extraPayment, undefined);
        windfallImpact = {
            interestSaved: Math.max(0, Math.round((avalancheWithoutWindfall.totalInterest - avalanche.totalInterest) * 100) / 100),
            monthsSaved: Math.max(0, avalancheWithoutWindfall.totalMonths - avalanche.totalMonths),
        };
    }

    let recommendation: string;
    if (interestSaved === 0 && monthsSaved === 0) {
        recommendation = 'Both strategies achieve identical payoff timelines for your current debt profile.';
    } else if (interestSaved < 100 && monthsSaved < 2) {
        recommendation = `The strategies are nearly identical. Avalanche saves ${interestSaved.toFixed(2)} in total interest. Choose Snowball if eliminating accounts quickly provides psychological momentum.`;
    } else {
        recommendation = `Avalanche is mathematically optimal, saving ${interestSaved.toFixed(2)} in interest and finishing ${monthsSaved} months sooner than Snowball.`;
    }

    return {
        snowball,
        avalanche,
        interestSaved,
        monthsSaved,
        recommendation,
        trajectoryComparison,
        windfallImpact,
    };
}

export function calculateTotalInterest(debts: Debt[]): number {
    const sortedOrder = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const result = simulatePayoff(debts, sortedOrder, 0, 'avalanche');
    return result.totalInterest;
}

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
        interestSaved: Math.round((withoutExtra.totalInterest - withExtra.totalInterest) * 100) / 100,
        monthsSaved: withoutExtra.totalMonths - withExtra.totalMonths,
    };
}

function emptyPlan(strategy: DebtStrategy): DebtPayoffPlan {
    return {
        strategy,
        debts: [],
        totalInterest: 0,
        totalMonths: 0,
        payoffPossible: true,
        monthlyPayment: 0,
        payoffDate: new Date().toISOString().split('T')[0],
        trajectory: [],
    };
}
