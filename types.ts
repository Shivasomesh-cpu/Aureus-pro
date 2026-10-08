export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export type Category =
  | 'Food' | 'Travel' | 'Shopping' | 'Utilities' | 'Entertainment'
  | 'Health' | 'Education' | 'Salary' | 'Investment' | 'Other'
  | 'Transportation' | 'Housing' | 'Healthcare' | 'Savings Envelope' | 'Tax Envelope';

export enum PayCycle {
  MONTHLY_1ST = 'monthly_1st',
  MONTHLY_15TH = 'monthly_15th',
  WEEKLY = 'weekly',
  CALENDAR_MONTH = 'calendar_month',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: Category;
  date: string; // ISO 8601 format
  notes?: string;
  aiGenerated?: boolean;
}

export interface Budget {
  id: string;
  category: Category;
  amount: number;
  month: string; // Format: YYYY-MM
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO Date
  color: string;
}

export interface SipInvestment {
  id: string;
  name: string;
  monthlyAmount: number;
  expectedAnnualReturn: number;
}

export interface FinancialPlan {
  currentAge: number | null;
  retirementAge: number | null;
  retirementSavings: number;
  desiredMonthlyRetirementIncome: number;
  sipInvestments: SipInvestment[];
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: Category;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string; // ISO Date
  isActive: boolean;
}

export interface FinancialInsight {
  type: 'alert' | 'prediction' | 'tip';
  message: string;
  relatedCategory?: Category;
  confidenceScore?: number;
}

// ============================================
// DEBT MANAGEMENT TYPES
// ============================================

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // Annual percentage rate
  minimumPayment: number;
  dueDate: number; // Day of month (1-31)
  type: 'credit_card' | 'personal_loan' | 'student_loan' | 'auto_loan' | 'mortgage' | 'other';
  creditor: string;
}

export type DebtStrategy = 'snowball' | 'avalanche' | 'custom';

export interface DebtPayoffPlan {
  strategy: DebtStrategy;
  debts: DebtPayoffSchedule[];
  totalInterest: number;
  totalMonths: number;
  payoffPossible: boolean;
  monthlyPayment: number;
  payoffDate: string; // ISO Date
  trajectory?: { month: number; totalBalance: number; interestPaid: number; principalPaid: number }[];
  windfall?: { amount: number; month: number };
}

export interface DebtPayoffSchedule {
  debtId: string;
  debtName: string;
  originalBalance: number;
  interestRate: number;
  payoffOrder: number;
  monthsToPayoff: number;
  totalInterestPaid: number;
  monthlyPayments: MonthlyPayment[];
}

export interface MonthlyPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

// ============================================
// ALERT & AUTOMATION TYPES
// ============================================

export enum AlertType {
  BILL_REMINDER = 'bill_reminder',
  SUBSCRIPTION_UNUSED = 'subscription_unused',
  PRICE_DROP = 'price_drop',
  BUDGET_WARNING = 'budget_warning',
  SAVINGS_MILESTONE = 'savings_milestone',
  DEBT_PAYMENT_DUE = 'debt_payment_due',
}

export enum AlertPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface Alert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  createdAt: string; // ISO Date
  dueDate?: string; // ISO Date (for bill reminders)
  relatedId?: string; // ID of related transaction, subscription, or debt
  dismissed: boolean;
  snoozedUntil?: string; // ISO Date
  actionUrl?: string;
}

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export enum SubscriptionStatus {
  ACTIVE = 'active',
  UNUSED = 'unused', // No usage in 60+ days
  EXPIRING = 'expiring',
  CANCELLED = 'cancelled',
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  category: Category;
  nextBillingDate: string; // ISO Date
  lastUsed?: string; // ISO Date
  status: SubscriptionStatus;
  autoDetected: boolean; // True if detected from transactions
  relatedTransactionIds: string[]; // Transaction IDs that match this subscription
}

// ============================================
// FINANCIAL HEALTH TYPES
// ============================================

export interface FinancialHealthScore {
  overallScore: number; // 0-100
  emergencyFund: EmergencyFundMetrics;
  retirement: RetirementMetrics;
  debtHealth: DebtHealthMetrics;
  lastCalculated: string; // ISO Date
}

export interface EmergencyFundMetrics {
  currentAmount: number;
  recommendedAmount: number; // 3-6 months of expenses
  monthsCovered: number;
  adequacy: 'Not set' | 'Critical' | 'Low' | 'Moderate' | 'Good' | 'Excellent';
  monthlyExpenses: number;
}

export interface RetirementMetrics {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  projectedRetirementIncome: number;
  requiredMonthlyIncome: number;
  readiness: 'Not set' | 'Behind' | 'On Track' | 'Ahead';
  yearsToRetirement: number;
}

export interface DebtHealthMetrics {
  totalDebt: number;
  monthlyIncome: number;
  debtToIncomeRatio: number; // Percentage
  rating: 'Not set' | 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  recommendation: string;
}

// ============================================
// AI/ML DEEP ANALYSIS TYPES
// ============================================

export interface SpendingVelocity {
  dailyBurnRate: number;
  weeklyAverage: number;
  monthlyAverage: number;
  trend: 'accelerating' | 'decelerating' | 'stable';
  trendPercentage: number; // % change over last 30 days
}

export interface CategoryAffinity {
  category: Category;
  frequency: number; // Number of transactions
  totalSpent: number;
  percentageOfTotal: number;
  consistency: number; // 0-100, how consistently they spend here
  rank: number;
}

export interface TemporalPattern {
  dayOfWeekDistribution: number[]; // [Mon, Tue, ... Sun] spending amounts
  peakSpendingDay: string;
  weekOfMonthDistribution: number[]; // [Week1, Week2, Week3, Week4]
  peakSpendingWeek: number;
  hourlyPattern?: string; // 'morning' | 'afternoon' | 'evening'
}

export interface BehavioralProfile {
  id: string;
  generatedAt: string; // ISO Date
  dataSpanDays: number; // How many days of data were analyzed
  transactionCount: number;
  spendingVelocity: SpendingVelocity;
  categoryAffinities: CategoryAffinity[];
  temporalPatterns: TemporalPattern;
  impulseVsPlannedRatio: number; // 0-1 (0 = fully planned, 1 = fully impulsive)
  impulseTransactionCount: number;
  plannedTransactionCount: number;
  riskToleranceScore: number; // 0-100
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  savingsConsistency: number; // 0-100
  topInsights: string[]; // Human-readable behavioral insights
}

// ============================================
// AUTONOMOUS BUDGET TUNING TYPES
// ============================================

export interface BudgetTuningRecommendation {
  category: Category;
  currentBudget: number;
  suggestedBudget: number;
  changeAmount: number; // positive = increase, negative = decrease
  changePercentage: number;
  confidence: number; // 0-100
  reason: string;
  priority: 'high' | 'medium' | 'low';
  type: 'increase' | 'decrease' | 'new' | 'maintain';
}

export interface AutonomousBudgetTuning {
  id: string;
  generatedAt: string; // ISO Date
  recommendations: BudgetTuningRecommendation[];
  totalSavingsPotential: number;
  seasonalContext: string; // e.g. "Holiday Season", "Back-to-School", "Normal"
  overallEfficiency: number; // 0-100, how well current budgets match spending
  appliedAt?: string; // ISO Date, if user applied the tuning
}

// ============================================
// PROACTIVE HEALTH OPTIMIZATION TYPES
// ============================================

export interface HealthTrajectoryPoint {
  daysAhead: number; // 0, 30, 60, 90
  predictedScore: number; // 0-100
  confidence: number; // 0-100
}

export interface EarlyWarning {
  id: string;
  metric: string; // e.g. 'debt_to_income', 'savings_rate', 'spending_velocity'
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: number;
  thresholdValue: number;
  trendDirection: 'improving' | 'worsening' | 'stable';
}

export interface HealthOptimizationAction {
  id: string;
  title: string;
  description: string;
  category: Category | 'general';
  estimatedImpact: number; // Estimated health points gained
  effort: 'easy' | 'moderate' | 'hard';
  priority: number; // 1 = highest
  timeframe: string; // e.g. "This week", "This month", "Next 90 days"
  isCompleted: boolean;
  completedAt?: string;
}

export interface ProactiveHealthOptimization {
  id: string;
  generatedAt: string; // ISO Date
  currentScore: number;
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  trajectory: HealthTrajectoryPoint[];
  earlyWarnings: EarlyWarning[];
  actions: HealthOptimizationAction[];
  scoreChangeFromLastMonth: number;
}


// ============================================
// LOCAL BRAIN & SIGNAL TYPES
// ============================================

export interface UserSignal {
  id: string;
  timestamp: string;
  type: 'click' | 'dismiss' | 'apply' | 'ignore';
  componentId: string;
  context: string; // e.g. "Budget Recommendation for Food"
}

export interface BehavioralDNA {
  spendingStyle: 'conservative' | 'balanced' | 'aggressive';
  topTrappings: Category[]; // Categories the user struggles with
  savingsVelocity: number;
  lastUpdated: string;
}

export interface LocalWeights {
  categoryWeights: Record<Category, number>;
  riskMultiplier: number;
  efficiencyScore: number;
}
