import { Transaction, Budget, SavingsGoal, RecurringTransaction } from '../types';

const TRANSACTIONS_KEY = 'expenseTrackerTransactions';
const BUDGETS_KEY = 'expenseTrackerBudgets';

// Transactions
export const getTransactions = (): Transaction[] => {
  try {
    const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
    if (!transactionsJson) return [];
    const transactions = JSON.parse(transactionsJson) as Transaction[];
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to parse transactions from localStorage', error);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Failed to save transactions to localStorage', error);
  }
};

// Budgets
export const getBudgets = (): Budget[] => {
  try {
    const budgetsJson = localStorage.getItem(BUDGETS_KEY);
    if (!budgetsJson) return [];
    return JSON.parse(budgetsJson) as Budget[];
  } catch (error) {
    console.error('Failed to parse budgets from localStorage', error);
    return [];
  }
};

export const saveBudgets = (budgets: Budget[]): void => {
  try {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  } catch (error) {
    console.error('Failed to save budgets to localStorage', error);
  }
};

const SAVINGS_KEY = 'expenseTrackerSavings';
const RECURRING_KEY = 'expenseTrackerRecurring';

// Savings Goals
export const getSavingsGoals = (): SavingsGoal[] => {
  try {
    const json = localStorage.getItem(SAVINGS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to parse savings goals', error);
    return [];
  }
};

export const saveSavingsGoals = (goals: SavingsGoal[]): void => {
  try {
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Failed to save savings goals', error);
  }
};

// Recurring Transactions
export const getRecurringTransactions = (): RecurringTransaction[] => {
  try {
    const json = localStorage.getItem(RECURRING_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to parse recurring transactions', error);
    return [];
  }
};

export const saveRecurringTransactions = (recurring: RecurringTransaction[]): void => {
  try {
    localStorage.setItem(RECURRING_KEY, JSON.stringify(recurring));
  } catch (error) {
    console.error('Failed to save recurring transactions', error);
  }
};

// Debts
const DEBTS_KEY = 'expenseTrackerDebts';

export const getDebts = (): any[] => {
  try {
    const json = localStorage.getItem(DEBTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to parse debts', error);
    return [];
  }
};

export const saveDebts = (debts: any[]): void => {
  try {
    localStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
  } catch (error) {
    console.error('Failed to save debts', error);
  }
};

// Alerts
const ALERTS_KEY = 'expenseTrackerAlerts';

export const getAlerts = (): any[] => {
  try {
    const json = localStorage.getItem(ALERTS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to parse alerts', error);
    return [];
  }
};

export const saveAlerts = (alerts: any[]): void => {
  try {
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Failed to save alerts', error);
  }
};

// Subscriptions
const SUBSCRIPTIONS_KEY = 'expenseTrackerSubscriptions';

export const getSubscriptions = (): any[] => {
  try {
    const json = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Failed to parse subscriptions', error);
    return [];
  }
};

export const saveSubscriptions = (subscriptions: any[]): void => {
  try {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Failed to save subscriptions', error);
  }
};

// Financial Health Metrics
const HEALTH_METRICS_KEY = 'expenseTrackerHealthMetrics';

export const getHealthMetrics = (): any | null => {
  try {
    const json = localStorage.getItem(HEALTH_METRICS_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to parse health metrics', error);
    return null;
  }
};

export const saveHealthMetrics = (metrics: any): void => {
  try {
    localStorage.setItem(HEALTH_METRICS_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Failed to save health metrics', error);
  }
};

// Behavioral Profile (Deep Analysis Engine)
const BEHAVIORAL_PROFILE_KEY = 'expenseTrackerBehavioralProfile';

export const getBehavioralProfile = (): any | null => {
  try {
    const json = localStorage.getItem(BEHAVIORAL_PROFILE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to parse behavioral profile', error);
    return null;
  }
};

export const saveBehavioralProfile = (profile: any): void => {
  try {
    localStorage.setItem(BEHAVIORAL_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save behavioral profile', error);
  }
};

// Budget Tuning (Autonomous Budget Tuner)
const BUDGET_TUNING_KEY = 'expenseTrackerBudgetTuning';

export const getBudgetTuning = (): any | null => {
  try {
    const json = localStorage.getItem(BUDGET_TUNING_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to parse budget tuning', error);
    return null;
  }
};

export const saveBudgetTuning = (tuning: any): void => {
  try {
    localStorage.setItem(BUDGET_TUNING_KEY, JSON.stringify(tuning));
  } catch (error) {
    console.error('Failed to save budget tuning', error);
  }
};

// Health Optimization (Proactive Health Optimizer)
const HEALTH_OPTIMIZATION_KEY = 'expenseTrackerHealthOptimization';

export const getHealthOptimization = (): any | null => {
  try {
    const json = localStorage.getItem(HEALTH_OPTIMIZATION_KEY);
    return json ? JSON.parse(json) : null;
  } catch (error) {
    console.error('Failed to parse health optimization', error);
    return null;
  }
};

export const saveHealthOptimization = (optimization: any): void => {
  try {
    localStorage.setItem(HEALTH_OPTIMIZATION_KEY, JSON.stringify(optimization));
  } catch (error) {
    console.error('Failed to save health optimization', error);
  }
};

