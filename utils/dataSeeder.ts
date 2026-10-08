import { Transaction, Budget, SavingsGoal, TransactionType, Category, Debt, Subscription, SubscriptionStatus } from '../types';
import { getSpendingPatterns, getRegionalData } from './kaggleDataTransformer';


interface CurrencyProfile {
    salary: number;
    rent: number;
    internet: number;
    electricity: number;
    water: number;
    insurance: number;
    netflix: number;
    coffee: number;
    lunchMin: number;
    lunchMax: number;
    groceryWeeklyMin: number;
    groceryWeeklyMax: number;
    transport: number;
    budgetFood: number;
    budgetTransport: number;
    budgetEntertainment: number;
    budgetShopping: number;
    budgetHousing: number;
    savingsEmergency: number;
    savingsVacation: number;
    savingsEmergencyCurrent: number;
    savingsVacationCurrent: number;
    debtCreditCard: number;
    debtStudentLoan: number;
    debtMortgage: number;
    debtCarLoan: number;
    debtMinPayment: number;
}

// Realistic middle-class profiles based on Verified Kaggle Datasets (2024)
// Key principle: income is tight, savings are modest, debt is real.
const CURRENCY_PROFILES: Record<string, CurrencyProfile> = {
    // US: 2024 Median Household Income ~$83k gross ≈ $5,400/mo net (Census Bureau/BLS)
    'USD': {
        salary: 5400, rent: 1850, internet: 85, electricity: 140, water: 55, insurance: 250, netflix: 15.49,
        coffee: 6.00, lunchMin: 15, lunchMax: 25, groceryWeeklyMin: 140, groceryWeeklyMax: 220, transport: 180,
        budgetFood: 950, budgetTransport: 450, budgetEntertainment: 250, budgetShopping: 350, budgetHousing: 2200,
        savingsEmergency: 15000, savingsVacation: 4500, savingsEmergencyCurrent: 4200, savingsVacationCurrent: 1200,
        debtCreditCard: 6500, debtStudentLoan: 35000, debtMortgage: 245000, debtCarLoan: 25000, debtMinPayment: 1850
    },
    // EUR: 2024 Weighted EU Median Net Income (Eurostat)
    'EUR': {
        salary: 2900, rent: 1100, internet: 45, electricity: 95, water: 35, insurance: 85, netflix: 13.99,
        coffee: 3.50, lunchMin: 12, lunchMax: 22, groceryWeeklyMin: 80, groceryWeeklyMax: 150, transport: 85,
        budgetFood: 600, budgetTransport: 250, budgetEntertainment: 180, budgetShopping: 200, budgetHousing: 1350,
        savingsEmergency: 10000, savingsVacation: 3500, savingsEmergencyCurrent: 2800, savingsVacationCurrent: 650,
        debtCreditCard: 2500, debtStudentLoan: 12000, debtMortgage: 185000, debtCarLoan: 15000, debtMinPayment: 950
    },
    // UK: 2024 Median Household Disposable Income (ONS)
    'GBP': {
        salary: 3100, rent: 1250, internet: 42, electricity: 115, water: 45, insurance: 110, netflix: 10.99,
        coffee: 4.20, lunchMin: 10, lunchMax: 18, groceryWeeklyMin: 75, groceryWeeklyMax: 130, transport: 120,
        budgetFood: 550, budgetTransport: 280, budgetEntertainment: 200, budgetShopping: 250, budgetHousing: 1450,
        savingsEmergency: 12000, savingsVacation: 3500, savingsEmergencyCurrent: 3500, savingsVacationCurrent: 800,
        debtCreditCard: 3500, debtStudentLoan: 18000, debtMortgage: 215000, debtCarLoan: 14500, debtMinPayment: 1200
    },
    // India: 2024 Urban Upper-Middle Class (CMIE/NSSO)
    'INR': {
        salary: 95000, rent: 28000, internet: 850, electricity: 4000, water: 600, insurance: 4500, netflix: 499,
        coffee: 280, lunchMin: 250, lunchMax: 700, groceryWeeklyMin: 3500, groceryWeeklyMax: 6500, transport: 5000,
        budgetFood: 18000, budgetTransport: 8000, budgetEntertainment: 6000, budgetShopping: 12000, budgetHousing: 35000,
        savingsEmergency: 350000, savingsVacation: 150000, savingsEmergencyCurrent: 95000, savingsVacationCurrent: 35000,
        debtCreditCard: 95000, debtStudentLoan: 850000, debtMortgage: 6500000, debtCarLoan: 1200000, debtMinPayment: 45000
    }
} as any;

export const generateDemoData = (currency: string = 'USD'): {
    transactions: Transaction[],
    budgets: Budget[],
    savingsGoals: SavingsGoal[],
    recurringTransactions: any[],
    debts: Debt[],
    subscriptions: Subscription[]
} => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = todayStr.slice(0, 7);
    const months: string[] = [];
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
        months.push(`${yyyy}-${mm}`);
    }

    const transactions: Transaction[] = [];

    // Fallback if currency not found
    const profile = CURRENCY_PROFILES[currency] || CURRENCY_PROFILES['USD'];
    const regional = getRegionalData(currency);

    // 1. Income (Salary & Investments) - Stable 3-month history
    months.forEach(month => {
        if (currency === 'USD') {
            // US often bi-weekly
            [1, 15].forEach(day => {
                const dateStr = `${month}-${day.toString().padStart(2, '0')}`;
                if (dateStr <= todayStr) {
                    transactions.push({
                        id: crypto.randomUUID(),
                        type: TransactionType.INCOME,
                        amount: profile.salary / 2,
                        category: 'Salary',
                        description: 'Bi-Weekly Salary Payment',
                        date: dateStr,
                        aiGenerated: true
                    });
                }
            });
        } else {
            // Others usually monthly
            const dateStr = `${month}-01`;
            if (dateStr <= todayStr) {
                transactions.push({
                    id: crypto.randomUUID(),
                    type: TransactionType.INCOME,
                    amount: profile.salary,
                    category: 'Salary',
                    description: 'Monthly Salary',
                    date: dateStr,
                    aiGenerated: true
                });
            }
        }

        const invDate = `${month}-05`;
        if (invDate <= todayStr) {
            transactions.push({
                id: crypto.randomUUID(),
                type: TransactionType.INCOME,
                amount: Math.round(profile.salary * 0.08),
                category: 'Investment',
                description: `${regional.banks[0]} Investment Portfolio Gains`,
                date: invDate,
                aiGenerated: true
            });
        }
    });

    // 2. Fixed Expenses - Perfectly Spread
    const fixedExpenses = [
        { amount: profile.rent, category: 'Housing' as Category, desc: 'Monthly Mortgage/Rent', day: '01' },
        { amount: profile.internet, category: 'Utilities' as Category, desc: 'Internet Service', day: '05' },
        { amount: profile.electricity, category: 'Utilities' as Category, desc: 'Electricity Bill', day: '15' },
        { amount: profile.water, category: 'Utilities' as Category, desc: 'Water & Sewer Bill', day: '18' },
        { amount: profile.insurance, category: 'Other' as Category, desc: 'Home/Auto Insurance', day: '03' },
        { amount: profile.netflix, category: 'Entertainment' as Category, desc: 'Netflix Family Plan', day: '10' },
        { amount: Math.round(profile.salary * 0.02), category: 'Education' as Category, desc: 'Kids School Fees', day: '08' }
    ];

    months.forEach(month => {
        fixedExpenses.forEach(exp => {
            const dateStr = `${month}-${exp.day}`;
            if (dateStr <= todayStr) {
                transactions.push({
                    id: crypto.randomUUID(),
                    type: TransactionType.EXPENSE,
                    amount: exp.amount,
                    category: exp.category,
                    description: exp.desc,
                    date: dateStr,
                    aiGenerated: true
                });
            }
        });
    });

    // 3. Variable Daily/Weekly Expenses - Stable & Evenly Distributed
    const patterns = getSpendingPatterns(currency);

    months.forEach((month) => {
        const year = parseInt(month.split('-')[0]);
        const m = parseInt(month.split('-')[1]) - 1;
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        const maxDay = month === currentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;

        for (let day = 1; day <= maxDay; day++) {
            const dateStr = `${month}-${day.toString().padStart(2, '0')}`;
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat

            // Variable daily expenses from spending patterns
            patterns.forEach(pattern => {
                let freq = pattern.frequency;

                // Coffee is a daily weekday thing
                if (pattern.description.includes('Coffee') || pattern.description.includes('Starbucks')) {
                    freq = (dayOfWeek >= 1 && dayOfWeek <= 5) ? freq : freq * 0.25;
                }

                // Groceries concentrated on weekends
                if (pattern.description.includes('Groceries')) {
                    freq = (dayOfWeek === 6) ? 0.85 : 0; // Almost always Saturday
                }

                if (Math.random() < freq) {
                    const amount = pattern.minAmount + Math.random() * (pattern.maxAmount - pattern.minAmount);
                    const merchant = pattern.merchants[Math.floor(Math.random() * pattern.merchants.length)];

                    transactions.push({
                        id: crypto.randomUUID(),
                        type: TransactionType.EXPENSE,
                        amount: parseFloat(amount.toFixed(2)),
                        category: pattern.category,
                        description: `${pattern.description} - ${merchant}`,
                        date: dateStr,
                        aiGenerated: true
                    });
                }
            });

            // 4. Festive Spikes
            regional.festivals.forEach(fest => {
                const festDate = `${month}-${fest.day.toString().padStart(2, '0')}`;
                if (dateStr === festDate && m === fest.month && dateStr <= todayStr) {
                    transactions.push({
                        id: crypto.randomUUID(),
                        type: TransactionType.EXPENSE,
                        amount: parseFloat((profile.salary * 0.06 * fest.spendingMultiplier).toFixed(2)),
                        category: 'Shopping',
                        description: `${fest.name} - ${fest.description}`,
                        date: dateStr,
                        aiGenerated: true
                    });
                }
            });

            // Random "Emergency" once every 4 months average
            if (Math.random() < (1 / 120)) {
                const emergencyTypes = [
                    { cat: 'Transportation', desc: 'Car Breakdown Repair', min: 100, max: 400 },
                    { cat: 'Healthcare', desc: 'Unexpected Medical/Dental', min: 80, max: 500 },
                    { cat: 'Housing', desc: 'Home Appliance Repair', min: 80, max: 300 }
                ];
                const type = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
                const scaledMin = type.min * (profile.salary / 5000);
                const scaledMax = type.max * (profile.salary / 5000);

                transactions.push({
                    id: crypto.randomUUID(),
                    type: TransactionType.EXPENSE,
                    amount: parseFloat((scaledMin + Math.random() * (scaledMax - scaledMin)).toFixed(2)),
                    category: type.cat as Category,
                    description: `URGENT: ${type.desc}`,
                    date: dateStr,
                    aiGenerated: true
                });
            }
        }
    });

    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Budgets for all 3 seeded months
    const budgets: Budget[] = [];
    months.forEach((m) => {
        budgets.push(
            { id: `b-food-${m}`, category: 'Food', amount: profile.budgetFood, month: m },
            { id: `b-trans-${m}`, category: 'Transportation', amount: profile.budgetTransport, month: m },
            { id: `b-ent-${m}`, category: 'Entertainment', amount: profile.budgetEntertainment, month: m },
            { id: `b-shop-${m}`, category: 'Shopping', amount: profile.budgetShopping, month: m },
            { id: `b-house-${m}`, category: 'Housing', amount: profile.budgetHousing, month: m },
        );
    });

    // Savings Goals (Added Retirement for Middle-Class Realism)
    const savingsGoals: SavingsGoal[] = [
        { id: '1', name: 'Emergency Fund', targetAmount: profile.savingsEmergency, currentAmount: profile.savingsEmergencyCurrent, color: '#10b981', deadline: '2027-12-31' },
        { id: '2', name: 'Family Vacation', targetAmount: profile.savingsVacation, currentAmount: profile.savingsVacationCurrent, color: '#3b82f6', deadline: '2027-06-30' },
        { id: '3', name: 'Retirement Savings', targetAmount: profile.salary * 100, currentAmount: profile.salary * 12, color: '#8b5cf6', deadline: '2055-01-01' }
    ];

    // Recurring Transactions
    const recurringTransactions: any[] = [
        { id: '1', type: TransactionType.EXPENSE, amount: profile.rent, category: 'Housing', description: 'Monthly Mortgage/Rent', frequency: 'monthly', nextDueDate: `${currentMonth}-01`, isActive: true },
        { id: '2', type: TransactionType.INCOME, amount: profile.salary, category: 'Salary', description: 'Monthly Salary', frequency: 'monthly', nextDueDate: `${currentMonth}-01`, isActive: true },
        { id: '3', type: TransactionType.EXPENSE, amount: profile.netflix, category: 'Entertainment', description: 'Netflix Family Plan', frequency: 'monthly', nextDueDate: `${currentMonth}-10`, isActive: true },
        { id: '4', type: TransactionType.EXPENSE, amount: profile.internet, category: 'Utilities', description: 'Internet Service', frequency: 'monthly', nextDueDate: `${currentMonth}-05`, isActive: true },
        { id: '5', type: TransactionType.EXPENSE, amount: profile.insurance, category: 'Other', description: 'Home/Auto Insurance', frequency: 'monthly', nextDueDate: `${currentMonth}-03`, isActive: true },
        { id: '6', type: TransactionType.EXPENSE, amount: profile.water, category: 'Utilities', description: 'Water & Sewer Bill', frequency: 'monthly', nextDueDate: `${currentMonth}-18`, isActive: true },
        { id: '7', type: TransactionType.INCOME, amount: Math.round(profile.salary * 0.08), category: 'Investment', description: 'Wealth Optimizer Contribution', frequency: 'monthly', nextDueDate: `${currentMonth}-05`, isActive: true },
    ];

    // Debts - Diversified for strategy differentiation
    const debts: Debt[] = [
        { id: '1', name: `${regional.creditors.creditCard[0]} Visa`, balance: Math.round(profile.debtCreditCard * 0.8), interestRate: 24.99, minimumPayment: 180, dueDate: 15, type: 'credit_card', creditor: regional.creditors.creditCard[0] },
        { id: '2', name: `${regional.creditors.studentLoan[0]} Loan`, balance: Math.round(profile.debtStudentLoan * 1.1), interestRate: 5.25, minimumPayment: 320, dueDate: 1, type: 'student_loan', creditor: regional.creditors.studentLoan[0] },
        { id: '3', name: `${regional.creditors.mortgage[0]} Mortgage`, balance: profile.debtMortgage, interestRate: 7.15, minimumPayment: Math.round(profile.rent * 0.75), dueDate: 1, type: 'mortgage', creditor: regional.creditors.mortgage[0] },
        { id: '4', name: `${regional.creditors.autoLoan[0]} Auto`, balance: Math.round(profile.debtCarLoan * 0.9), interestRate: 6.85, minimumPayment: 420, dueDate: 22, type: 'auto_loan', creditor: regional.creditors.autoLoan[0] }
    ];

    // Subscriptions - Scaled for currency realism
    const salaryRatio = profile.salary / CURRENCY_PROFILES['USD'].salary;
    const subscriptions: Subscription[] = [
        { id: '1', name: 'Netflix Standard', amount: profile.netflix, frequency: 'monthly', category: 'Entertainment', nextBillingDate: `${currentMonth}-10`, status: SubscriptionStatus.ACTIVE, autoDetected: false, relatedTransactionIds: [] },
        { id: '2', name: 'Spotify Family', amount: parseFloat((10.99 * salaryRatio).toFixed(2)), frequency: 'monthly', category: 'Entertainment', nextBillingDate: `${currentMonth}-15`, status: SubscriptionStatus.ACTIVE, autoDetected: false, relatedTransactionIds: [] },
        { id: '3', name: 'Amazon Prime', amount: parseFloat((14.99 * salaryRatio).toFixed(2)), frequency: 'monthly', category: 'Shopping', nextBillingDate: `${currentMonth}-08`, status: SubscriptionStatus.ACTIVE, autoDetected: false, relatedTransactionIds: [] },
        { id: '4', name: 'Planet Fitness', amount: parseFloat((25 * salaryRatio).toFixed(2)), frequency: 'monthly', category: 'Healthcare', nextBillingDate: `${currentMonth}-01`, status: SubscriptionStatus.ACTIVE, autoDetected: false, relatedTransactionIds: [] },
        { id: '5', name: 'YouTube Premium', amount: parseFloat((13.99 * salaryRatio).toFixed(2)), frequency: 'monthly', category: 'Entertainment', nextBillingDate: `${currentMonth}-20`, status: SubscriptionStatus.ACTIVE, autoDetected: false, relatedTransactionIds: [] }
    ];

    return { transactions, budgets, savingsGoals, recurringTransactions, debts, subscriptions };
};

export const clearData = () => {
    localStorage.removeItem('expenseTrackerTransactions');
    localStorage.removeItem('expenseTrackerBudgets');
    localStorage.removeItem('expenseTrackerSavings');
    localStorage.removeItem('expenseTrackerRecurring');
    localStorage.removeItem('expenseTrackerDebts');
    localStorage.removeItem('expenseTrackerSubscriptions');
    localStorage.removeItem('expenseTrackerHealthMetrics');
    localStorage.removeItem('expenseTrackerBehavioralProfile');
    localStorage.removeItem('expenseTrackerBudgetTuning');
    localStorage.removeItem('expenseTrackerHealthOptimization');
    localStorage.removeItem('aureusFinancialPlan');
};
