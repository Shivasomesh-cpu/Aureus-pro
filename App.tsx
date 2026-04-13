import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, TransactionType, Budget, SavingsGoal, RecurringTransaction, Debt, Subscription, FinancialHealthScore, Alert, BehavioralProfile, AutonomousBudgetTuning, ProactiveHealthOptimization } from './types';
import { getTransactions, saveTransactions, getBudgets, saveBudgets, getSavingsGoals, saveSavingsGoals, getRecurringTransactions, saveRecurringTransactions, getDebts, saveDebts, getSubscriptions, saveSubscriptions, getHealthMetrics, saveHealthMetrics, getBehavioralProfile, saveBehavioralProfile, getBudgetTuning, saveBudgetTuning, getHealthOptimization, saveHealthOptimization } from './services/storageService';
import { SettingsProvider } from './contexts/SettingsContext';
import Header from './components/Header';
import SummaryCard from './components/SummaryCard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import { PlusIcon } from './components/icons';
import Reports from './components/Reports';
import BudgetProgress from './components/BudgetProgress';
import BudgetManager from './components/BudgetManager';
import SmartInput from './components/SmartInput';
import AIInsightsWidget from './components/AIInsightsWidget';
import SavingsGoals from './components/SavingsGoals';
import RecurringManager from './components/RecurringManager';
import FinancialHealthWidget from './components/FinancialHealthWidget';
import DebtManager from './components/DebtManager';
import AlertsWidget from './components/AlertsWidget';
import DeepAnalysisWidget from './components/DeepAnalysisWidget';
import BudgetTuningWidget from './components/BudgetTuningWidget';
import HealthOptimizationWidget from './components/HealthOptimizationWidget';
import AIIntelligencePage from './components/AIIntelligencePage';
import { detectSubscriptions, generateAllAlerts, dismissAlert, snoozeAlert } from './services/alertService';
import { calculateFinancialHealthScore } from './services/healthScoreService';
import { generateBehavioralProfile } from './services/deepAnalysisEngine';
import { generateBudgetTuning } from './services/autonomousBudgetTuner';
import { generateHealthOptimization } from './services/proactiveHealthOptimizer';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // New state for advanced features
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // AI/ML Engine State
  const [behavioralProfile, setBehavioralProfile] = useState<BehavioralProfile | null>(null);
  const [budgetTuning, setBudgetTuning] = useState<AutonomousBudgetTuning | null>(null);
  const [healthOptimization, setHealthOptimization] = useState<ProactiveHealthOptimization | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'reports' | 'ai'>('dashboard');

  useEffect(() => {
    setTransactions(getTransactions());
    setBudgets(getBudgets());
    setSavingsGoals(getSavingsGoals());
    setRecurringTransactions(getRecurringTransactions());
    setDebts(getDebts());
    setSubscriptions(getSubscriptions());
    const savedHealth = getHealthMetrics();
    if (savedHealth) setHealthScore(savedHealth);
    const savedProfile = getBehavioralProfile();
    if (savedProfile) setBehavioralProfile(savedProfile);
    const savedTuning = getBudgetTuning();
    if (savedTuning) setBudgetTuning(savedTuning);
    const savedOptimization = getHealthOptimization();
    if (savedOptimization) setHealthOptimization(savedOptimization);

    checkRecurringTransactions();
    updateSubscriptions();
    updateHealthScore();
    updateAlerts();
  }, []);

  // Update health score, alerts, and AI/ML engines when data changes
  useEffect(() => {
    if (transactions.length > 0) {
      updateHealthScore();
      updateAlerts();
      updateAIEngines();
    }
  }, [transactions, debts, savingsGoals, recurringTransactions, subscriptions, budgets]);


  const checkRecurringTransactions = () => {
    const recs = getRecurringTransactions();
    const today = new Date().toISOString().split('T')[0];
    let newTransactionsFound = false;
    const newTransactions: Transaction[] = [];

    const updatedRecs = recs.map(rec => {
      if (rec.isActive && rec.nextDueDate <= today) {
        // Create transaction
        newTransactions.push({
          id: crypto.randomUUID(),
          type: rec.type,
          amount: rec.amount,
          description: rec.description,
          category: rec.category,
          date: today,
        });
        newTransactionsFound = true;

        // Update next due date
        const nextDate = new Date(rec.nextDueDate);
        if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        return { ...rec, nextDueDate: nextDate.toISOString().split('T')[0] };
      }
      return rec;
    });

    if (newTransactionsFound) {
      const currentTransactions = getTransactions();
      const allTransactions = [...currentTransactions, ...newTransactions];
      setTransactions(allTransactions);
      saveTransactions(allTransactions);
      setRecurringTransactions(updatedRecs);
      saveRecurringTransactions(updatedRecs);
      // Optional: Notify user
      console.log("Processed recurring transactions");
    }
  };

  const updateSubscriptions = () => {
    const detected = detectSubscriptions(transactions);
    setSubscriptions(detected);
    saveSubscriptions(detected);
  };

  const updateHealthScore = () => {
    if (transactions.length > 0) {
      const score = calculateFinancialHealthScore(transactions, debts, savingsGoals);
      setHealthScore(score);
      saveHealthMetrics(score);
    }
  };

  const updateAlerts = () => {
    const generated = generateAllAlerts(transactions, recurringTransactions, subscriptions, debts, alerts);
    if (generated.length > 0) {
      setAlerts(prev => [...prev.filter(a => a.dismissed || (a.snoozedUntil && new Date(a.snoozedUntil) > new Date())), ...generated]);
    }
  };

  const updateAIEngines = () => {
    // Deep Analysis Engine
    const profile = generateBehavioralProfile(transactions, savingsGoals);
    if (profile) {
      setBehavioralProfile(profile);
      saveBehavioralProfile(profile);
    }

    // Autonomous Budget Tuner
    const tuning = generateBudgetTuning(transactions, budgets);
    if (tuning) {
      setBudgetTuning(tuning);
      saveBudgetTuning(tuning);
    }

    // Proactive Health Optimizer
    const optimization = generateHealthOptimization(transactions, budgets, debts, savingsGoals, healthScore);
    if (optimization) {
      setHealthOptimization(optimization);
      saveHealthOptimization(optimization);
    }
  };

  const handleApplyBudgetTuning = (recommendations: any[]) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    let updatedBudgets = [...budgets];

    recommendations.forEach(rec => {
      const existing = updatedBudgets.find(b => b.category === rec.category && b.month === currentMonth);
      if (existing) {
        updatedBudgets = updatedBudgets.map(b =>
          b.id === existing.id ? { ...b, amount: rec.suggestedBudget } : b
        );
      } else {
        updatedBudgets.push({
          id: crypto.randomUUID(),
          category: rec.category,
          amount: rec.suggestedBudget,
          month: currentMonth
        });
      }
    });

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  };

  const handleToggleHealthAction = (actionId: string) => {
    if (!healthOptimization) return;
    const updated = {
      ...healthOptimization,
      actions: healthOptimization.actions.map(a =>
        a.id === actionId ? { ...a, isCompleted: !a.isCompleted, completedAt: !a.isCompleted ? new Date().toISOString() : undefined } : a
      )
    };
    setHealthOptimization(updated);
    saveHealthOptimization(updated);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => dismissAlert(prev, alertId));
  };

  const handleSnoozeAlert = (alertId: string, days: number) => {
    setAlerts(prev => snoozeAlert(prev, alertId, days));
  };



  // Savings Goals Handlers
  const handleSaveGoal = (goal: SavingsGoal) => {
    const updated = [...savingsGoals, goal];
    setSavingsGoals(updated);
    saveSavingsGoals(updated);
  };
  const handleUpdateGoal = (goal: SavingsGoal) => {
    const updated = savingsGoals.map(g => g.id === goal.id ? goal : g);
    setSavingsGoals(updated);
    saveSavingsGoals(updated);
  };
  const handleDeleteGoal = (id: string) => {
    const updated = savingsGoals.filter(g => g.id !== id);
    setSavingsGoals(updated);
    saveSavingsGoals(updated);
  };

  // Recurring Handlers
  const handleSaveRecurring = (rec: RecurringTransaction) => {
    const updated = [...recurringTransactions, rec];
    setRecurringTransactions(updated);
    saveRecurringTransactions(updated);
  };
  const handleDeleteRecurring = (id: string) => {
    const updated = recurringTransactions.filter(r => r.id !== id);
    setRecurringTransactions(updated);
    saveRecurringTransactions(updated);
  };

  // Debt Handlers
  const handleAddDebt = (debt: Debt) => {
    const updated = [...debts, debt];
    setDebts(updated);
    saveDebts(updated);
  };
  const handleDeleteDebt = (id: string) => {
    const updated = debts.filter(d => d.id !== id);
    setDebts(updated);
    saveDebts(updated);
  };


  const handleSaveTransaction = useCallback((transaction: Transaction) => {
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    let updatedTransactions;

    if (existingIndex > -1) {
      updatedTransactions = transactions.map(t => t.id === transaction.id ? transaction : t);
    } else {
      updatedTransactions = [...transactions, transaction];
    }

    updatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(updatedTransactions);
    saveTransactions(updatedTransactions);
    setTransactionToEdit(null);
  }, [transactions]);

  const handleAddTransactionFromNLP = useCallback((transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: new Date().toISOString() + Math.random(),
    };
    handleSaveTransaction(newTransaction);
  }, [handleSaveTransaction]);

  const handleDeleteTransaction = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      saveTransactions(updatedTransactions);
    }
  }, [transactions]);

  const handleSaveBudget = useCallback((newBudget: Omit<Budget, 'id' | 'month'>) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existingBudget = budgets.find(b => b.category === newBudget.category && b.month === currentMonth);

    if (existingBudget) {
      const updatedBudgets = budgets.map(b => b.id === existingBudget.id ? { ...b, amount: newBudget.amount } : b);
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
    } else {
      const budgetWithId: Budget = {
        ...newBudget,
        id: new Date().toISOString() + Math.random(),
        month: currentMonth,
      };
      const updatedBudgets = [...budgets, budgetWithId];
      setBudgets(updatedBudgets);
      saveBudgets(updatedBudgets);
    }
  }, [budgets]);

  const handleDeleteBudget = useCallback((id: string) => {
    const updatedBudgets = budgets.filter(b => b.id !== id);
    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);
  }, [budgets]);

  const handleEditTransaction = (transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsFormOpen(true);
  };

  const handleOpenForm = () => {
    setTransactionToEdit(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setTransactionToEdit(null);
  }

  const { totalIncome, totalExpense, balance, incomeTrend, expenseTrend } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    let prevMonthIncome = 0;
    let prevMonthExpense = 0;
    let allTimeIncome = 0;
    let allTimeExpense = 0;

    for (const t of transactions) {
      const tDate = new Date(t.date);
      const tMonth = tDate.getMonth();
      const tYear = tDate.getFullYear();

      if (t.type === TransactionType.INCOME) {
        allTimeIncome += t.amount;
        if (tYear === currentYear && tMonth === currentMonth) currentMonthIncome += t.amount;
        if (tYear === prevMonthYear && tMonth === prevMonth) prevMonthIncome += t.amount;
      } else {
        allTimeExpense += t.amount;
        if (tYear === currentYear && tMonth === currentMonth) currentMonthExpense += t.amount;
        if (tYear === prevMonthYear && tMonth === prevMonth) prevMonthExpense += t.amount;
      }
    }

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? Infinity : 0;
      return ((current - previous) / previous) * 100;
    }

    return {
      totalIncome: allTimeIncome,
      totalExpense: allTimeExpense,
      balance: allTimeIncome - allTimeExpense,
      incomeTrend: calculateTrend(currentMonthIncome, prevMonthIncome),
      expenseTrend: calculateTrend(currentMonthExpense, prevMonthExpense),
    };
  }, [transactions]);

  return (
    <SettingsProvider>
      <div className="min-h-screen text-gray-100 transition-colors duration-300">
        {/* Subtle noise texture overlay */}
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.08] pointer-events-none z-0"></div>
        {/* Ambient background glows */}
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/[0.06] rounded-full blur-[150px] pointer-events-none z-0"></div>
        <div className="fixed top-[20%] right-[10%] w-[30%] h-[30%] bg-violet-600/[0.03] rounded-full blur-[100px] pointer-events-none z-0"></div>

        <div className="relative z-10">
          <Header
            currentView={currentView}
            onChangeView={setCurrentView}
            onManageBudgets={() => setIsBudgetModalOpen(true)}
            onManageDebts={() => setIsDebtModalOpen(true)}
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
            onSnoozeAlert={handleSnoozeAlert}
          />

          <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 ${currentView === 'ai' ? 'max-w-screen-2xl' : 'max-w-7xl'}`}>
            {currentView === 'reports' ? (
              <div className="animate-fade-in-up">
                <Reports transactions={transactions} />
              </div>
            ) : currentView === 'ai' ? (
              <AIIntelligencePage
                behavioralProfile={behavioralProfile}
                budgetTuning={budgetTuning}
                healthOptimization={healthOptimization}
                transactions={transactions}
                budgets={budgets}
                savingsGoals={savingsGoals}
                debts={debts}
                subscriptions={subscriptions}
                recurringTransactions={recurringTransactions}
                healthScore={healthScore}
                onApplyTuning={handleApplyBudgetTuning}
                onToggleAction={handleToggleHealthAction}
              />
            ) : (
              <div className="space-y-8 animate-fade-in-up">

                <AIInsightsWidget transactions={transactions} budgets={budgets} />

                <div className="max-w-3xl mx-auto">
                  <SmartInput onSave={handleAddTransactionFromNLP} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <SummaryCard title="Total Income" amount={totalIncome} colorClass="text-emerald-400" trend={incomeTrend} />
                  <SummaryCard title="Total Expense" amount={totalExpense} colorClass="text-rose-400" trend={expenseTrend} />
                  <SummaryCard title="Balance" amount={balance} colorClass={balance >= 0 ? 'text-blue-400' : 'text-rose-400'} />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">

                  {/* Left Column: Wealth & Health (4 Cols) */}
                  <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
                    <section>
                      <h2 className="text-[10px] font-bold text-amber-500/70 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-breathe"></span>
                        Financial Wellness
                      </h2>
                      <FinancialHealthWidget healthScore={healthScore} />
                    </section>

                    <section>
                      <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500/50 animate-breathe"></span>
                        Budget Allocation
                      </h2>
                      <BudgetProgress budgets={budgets} transactions={transactions} />
                    </section>
                  </div>

                  {/* Center Column: Activities (5 Cols) */}
                  <div className="lg:col-span-5 space-y-8 order-1 lg:order-2">
                    <section>
                      <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-breathe"></span>
                        Recent Activities
                      </h2>
                      <TransactionList transactions={transactions} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    </section>
                  </div>

                  {/* Right Column: Planning & Goals (3 Cols) */}
                  <div className="lg:col-span-3 space-y-8 order-3">
                    <section>
                      <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500/50 animate-breathe"></span>
                        Future Targets
                      </h2>
                      <SavingsGoals
                        goals={savingsGoals}
                        onAddGoal={handleSaveGoal}
                        onUpdateGoal={handleUpdateGoal}
                        onDeleteGoal={handleDeleteGoal}
                      />
                    </section>

                    <section>
                      <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500/50 animate-breathe"></span>
                        Recurring Bills
                      </h2>
                      <RecurringManager
                        recurringTransactions={recurringTransactions}
                        onAddRecurring={handleSaveRecurring}
                        onDeleteRecurring={handleDeleteRecurring}
                      />
                    </section>
                  </div>
                </div>
              </div>
            )}
          </main>

          <button
            onClick={handleOpenForm}
            className="fixed bottom-8 right-8 bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white p-4 rounded-2xl shadow-xl shadow-amber-600/25 transition-all duration-300 hover:scale-110 hover:shadow-amber-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ring-offset-gray-900 group animate-pulse-glow"
            aria-label="Add new transaction manually"
          >
            <PlusIcon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          <TransactionForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSave={handleSaveTransaction}
            transactionToEdit={transactionToEdit}
          />

          <BudgetManager
            isOpen={isBudgetModalOpen}
            onClose={() => setIsBudgetModalOpen(false)}
            onSave={handleSaveBudget}
            onDelete={handleDeleteBudget}
            existingBudgets={budgets}
          />

          <DebtManager
            debts={debts}
            onAddDebt={handleAddDebt}
            onDeleteDebt={handleDeleteDebt}
            isOpen={isDebtModalOpen}
            onClose={() => setIsDebtModalOpen(false)}
          />
        </div>
      </div>
    </SettingsProvider>
  );
};

export default App;