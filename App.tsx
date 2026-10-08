import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Budget, SavingsGoal, RecurringTransaction, Debt, Subscription, FinancialHealthScore, Alert, BehavioralProfile, AutonomousBudgetTuning, ProactiveHealthOptimization, BudgetTuningRecommendation, FinancialPlan } from './types';
import { getTransactions, saveTransactions, getBudgets, saveBudgets, getSavingsGoals, saveSavingsGoals, getRecurringTransactions, saveRecurringTransactions, getDebts, saveDebts, getSubscriptions, saveSubscriptions, getHealthMetrics, saveHealthMetrics, getBehavioralProfile, saveBehavioralProfile, getBudgetTuning, saveBudgetTuning, getHealthOptimization, saveHealthOptimization, getFinancialPlan, saveFinancialPlan } from './services/storageService';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
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
import AIIntelligencePage from './components/AIIntelligencePage';
import CommandPalette from './components/CommandPalette';
import BankStatementUploader from './components/BankStatementUploader';
import GoalsConfigurator from './components/GoalsConfigurator';
import FinancialPlanPage from './components/FinancialPlanPage';
import { detectSubscriptions, generateAllAlerts, dismissAlert, snoozeAlert } from './services/alertService';
import { calculateFinancialHealthScore } from './services/healthScoreService';
import { generateBehavioralProfile } from './services/deepAnalysisEngine';
import { generateBudgetTuning } from './services/autonomousBudgetTuner';
import { generateHealthOptimization } from './services/proactiveHealthOptimizer';
import { generateDemoData, clearData } from './utils/dataSeeder';
import { useLenis } from './hooks/useLenis';
import { fireConfetti } from './utils/confetti';

const AppContent: React.FC = () => {
  const { currency, formatCurrency } = useSettings();
  const { showToast } = useToast();

  // Activate Lenis buttery-smooth scrolling engine across the application
  useLenis(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  // State for advanced features
  const [debts, setDebts] = useState<Debt[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // AI/ML Engine State
  const [behavioralProfile, setBehavioralProfile] = useState<BehavioralProfile | null>(null);
  const [budgetTuning, setBudgetTuning] = useState<AutonomousBudgetTuning | null>(null);
  const [healthOptimization, setHealthOptimization] = useState<ProactiveHealthOptimization | null>(null);
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const hasInitialized = useRef(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'reports' | 'ai' | 'plan'>('landing');
  const [aiSelectedTab, setAiSelectedTab] = useState<string>('all');

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initData = async () => {
      let txs = await getTransactions();
      let bgs = getBudgets();
      let goals = getSavingsGoals();
      let recs = getRecurringTransactions();
      let dts = getDebts();
      let subs = getSubscriptions();
      const savedPlan = getFinancialPlan();
      setFinancialPlan(savedPlan);

      setTransactions(txs);
      setBudgets(bgs);
      setSavingsGoals(goals);
      setRecurringTransactions(recs);
      setDebts(dts);
      setSubscriptions(subs);

      if (txs.length > 0) {
        const score = calculateFinancialHealthScore(txs, dts, goals, savedPlan);
        setHealthScore(score);
        saveHealthMetrics(score);
      }

      const profile = txs.length ? generateBehavioralProfile(txs, goals) : null;
      if (profile) {
        setBehavioralProfile(profile);
        saveBehavioralProfile(profile);
      }

      const tuning = txs.length ? generateBudgetTuning(txs, bgs) : null;
      if (tuning) {
        setBudgetTuning(tuning);
        saveBudgetTuning(tuning);
      }

      const opt = txs.length ? generateHealthOptimization(txs, bgs, dts, goals, calculateFinancialHealthScore(txs, dts, goals, savedPlan)) : null;
      if (opt) {
        setHealthOptimization(opt);
        saveHealthOptimization(opt);
      }

      const initialAlerts = generateAllAlerts(txs, recs, subs, dts, []);
      setAlerts(initialAlerts);

      await checkRecurringTransactions();
      setIsDataLoaded(true);
    };

    initData();
  }, []);

  // Update health score, alerts, and AI/ML engines when data changes
  useEffect(() => {
    if (transactions.length > 0) {
      updateHealthScore();
      updateAlerts();
      updateAIEngines();
    }
  }, [transactions, debts, savingsGoals, recurringTransactions, subscriptions, budgets, financialPlan]);

  const checkRecurringTransactions = async () => {
    const recs = getRecurringTransactions();
    const today = new Date().toISOString().split('T')[0];
    let newTransactionsFound = false;
    const newTransactions: Transaction[] = [];

    const updatedRecs = recs.map(rec => {
      if (rec.isActive && rec.nextDueDate <= today) {
        newTransactions.push({
          id: crypto.randomUUID(),
          type: rec.type,
          amount: rec.amount,
          description: rec.description,
          category: rec.category,
          date: today,
        });
        newTransactionsFound = true;

        const nextDate = new Date(rec.nextDueDate);
        if (rec.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        if (rec.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        if (rec.frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);

        return { ...rec, nextDueDate: nextDate.toISOString().split('T')[0] };
      }
      return rec;
    });

    if (newTransactionsFound) {
      const currentTransactions = await getTransactions();
      const allTransactions = [...currentTransactions, ...newTransactions];
      setTransactions(allTransactions);
      await saveTransactions(allTransactions);
      setRecurringTransactions(updatedRecs);
      saveRecurringTransactions(updatedRecs);
    }
  };

  const updateHealthScore = () => {
    if (transactions.length > 0) {
      const score = calculateFinancialHealthScore(transactions, debts, savingsGoals, financialPlan);
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
    const profile = generateBehavioralProfile(transactions, savingsGoals);
    if (profile) {
      setBehavioralProfile(profile);
      saveBehavioralProfile(profile);
    }

    const tuning = generateBudgetTuning(transactions, budgets);
    if (tuning) {
      setBudgetTuning(tuning);
      saveBudgetTuning(tuning);
    }

    const optimization = generateHealthOptimization(transactions, budgets, debts, savingsGoals, healthScore);
    if (optimization) {
      setHealthOptimization(optimization);
      saveHealthOptimization(optimization);
    }
  };

  const handleApplyBudgetTuning = (recommendations: BudgetTuningRecommendation[]) => {
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

    showToast({
      type: 'success',
      title: 'Autonomous Budgets Rebalanced',
      message: `Adjusted limits across ${recommendations.length} categories (+4 pts projected health).`,
    });
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

    const action = healthOptimization.actions.find(a => a.id === actionId);
    if (action && !action.isCompleted) {
      fireConfetti({ count: 40 });
      showToast({
        type: 'success',
        title: 'Action Step Completed',
        message: action.title,
      });
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => dismissAlert(prev, alertId));
  };

  const handleSnoozeAlert = (alertId: string, days: number) => {
    setAlerts(prev => snoozeAlert(prev, alertId, days));
    showToast({
      type: 'info',
      title: 'Alert Snoozed',
      message: `Reminder deferred for ${days} days.`,
    });
  };

  // Savings Goals Handlers
  const handleSaveGoal = (goal: SavingsGoal) => {
    const updated = [...savingsGoals, goal];
    setSavingsGoals(updated);
    saveSavingsGoals(updated);
    showToast({
      type: 'success',
      title: 'Target Initialized',
      message: `Goal "${goal.name}" created (${formatCurrency(goal.targetAmount)}).`,
    });
  };

  const handleUpdateGoal = (goal: SavingsGoal) => {
    const previousGoal = savingsGoals.find(existingGoal => existingGoal.id === goal.id);
    const updated = savingsGoals.map(g => g.id === goal.id ? goal : g);
    setSavingsGoals(updated);
    saveSavingsGoals(updated);

    if (goal.currentAmount >= goal.targetAmount && (previousGoal?.currentAmount ?? 0) < goal.targetAmount) {
      fireConfetti({ count: 100 });
      showToast({
        type: 'success',
        title: '🎉 Target Achieved!',
        message: `Congratulations! You've completely funded "${goal.name}".`,
        duration: 5000,
      });
    } else {
      showToast({
        type: 'info',
        title: 'Savings Progress Saved',
        message: `${goal.name}: ${formatCurrency(goal.currentAmount)} of ${formatCurrency(goal.targetAmount)}`,
      });
    }
  };

  const handleDeleteGoal = (id: string) => {
    const updated = savingsGoals.filter(g => g.id !== id);
    setSavingsGoals(updated);
    saveSavingsGoals(updated);
  };

  const handleImportStatementTransactions = async (importedTxs: Transaction[]) => {
    const updated = [...importedTxs, ...transactions];
    setTransactions(updated);
    await saveTransactions(updated);
    setIsStatementModalOpen(false);
    setCurrentView('dashboard');
    fireConfetti({ count: 60 });
    showToast({
      type: 'success',
      title: 'Bank Statement Ingested',
      message: `Successfully analyzed and merged ${importedTxs.length} statement records into Aureus!`,
    });
  };

  const handleSaveFinancialPlan = (plan: FinancialPlan) => {
    setFinancialPlan(plan);
    saveFinancialPlan(plan);
    showToast({ type: 'success', title: 'Financial plan saved', message: 'Your goals and investment assumptions are stored in this browser.' });
  };

  // Recurring Handlers
  const handleSaveRecurring = (rec: RecurringTransaction) => {
    const updated = [...recurringTransactions, rec];
    setRecurringTransactions(updated);
    saveRecurringTransactions(updated);
    showToast({
      type: 'success',
      title: 'Recurring Rule Added',
      message: `${rec.description} (${rec.frequency})`,
    });
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
    showToast({
      type: 'info',
      title: 'Debt Account Configured',
      message: `${debt.name} added to Avalanche schedule.`,
    });
  };

  const handleDeleteDebt = (id: string) => {
    const updated = debts.filter(d => d.id !== id);
    setDebts(updated);
    saveDebts(updated);
    showToast({
      type: 'info',
      title: 'Debt Account Removed',
      message: 'Payoff timelines recalculated.',
    });
  };

  // Reactive Demo Data Loader
  const handleLoadDemoData = useCallback((targetCurrency?: string) => {
    const activeCurr = targetCurrency || currency || 'USD';
    const demo = generateDemoData(activeCurr);
    saveTransactions(demo.transactions);
    saveBudgets(demo.budgets);
    saveSavingsGoals(demo.savingsGoals);
    saveRecurringTransactions(demo.recurringTransactions);
    saveDebts(demo.debts);
    saveSubscriptions(demo.subscriptions);

    setTransactions(demo.transactions);
    setBudgets(demo.budgets);
    setSavingsGoals(demo.savingsGoals);
    setRecurringTransactions(demo.recurringTransactions);
    setDebts(demo.debts);
    setSubscriptions(demo.subscriptions);

    const score = calculateFinancialHealthScore(demo.transactions, demo.debts, demo.savingsGoals, financialPlan);
    setHealthScore(score);
    saveHealthMetrics(score);

    const profile = generateBehavioralProfile(demo.transactions, demo.savingsGoals);
    setBehavioralProfile(profile);
    if (profile) saveBehavioralProfile(profile);

    const tuning = generateBudgetTuning(demo.transactions, demo.budgets);
    setBudgetTuning(tuning);
    if (tuning) saveBudgetTuning(tuning);

    const opt = generateHealthOptimization(demo.transactions, demo.budgets, demo.debts, demo.savingsGoals, score);
    setHealthOptimization(opt);
    if (opt) saveHealthOptimization(opt);

    const newAlerts = generateAllAlerts(demo.transactions, demo.recurringTransactions, demo.subscriptions, demo.debts, []);
    setAlerts(newAlerts);

    showToast({
      type: 'success',
      title: 'Realistic Dataset Loaded',
      message: `Demo financial data loaded in ${activeCurr}, replacing your previous local data.`,
      duration: 3500,
    });
  }, [currency, financialPlan, showToast]);

  const handleResetData = useCallback(() => {
    clearData();
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
    setRecurringTransactions([]);
    setDebts([]);
    setSubscriptions([]);
    setHealthScore(null);
    setBehavioralProfile(null);
    setBudgetTuning(null);
    setHealthOptimization(null);
    setAlerts([]);
    setFinancialPlan(null);
    setCurrentView('dashboard');

    showToast({
      type: 'warning',
      title: 'Storage Wiped',
      message: 'All local data was cleared from browser storage.',
    });
  }, [showToast]);

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

    showToast({
      type: 'success',
      title: existingIndex > -1 ? 'Transaction Updated' : 'Transaction Logged',
      message: `${transaction.description}: ${formatCurrency(transaction.amount)}`,
    });
  }, [transactions, formatCurrency, showToast]);

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
      showToast({
        type: 'info',
        title: 'Transaction Deleted',
        message: 'Records and cash flow metrics updated.',
      });
    }
  }, [transactions, showToast]);

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

    showToast({
      type: 'success',
      title: 'Budget Allocation Set',
      message: `${newBudget.category}: ${formatCurrency(newBudget.amount)}/mo`,
    });
  }, [budgets, formatCurrency, showToast]);

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
  };

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
    };

    return {
      totalIncome: allTimeIncome,
      totalExpense: allTimeExpense,
      balance: allTimeIncome - allTimeExpense,
      incomeTrend: calculateTrend(currentMonthIncome, prevMonthIncome),
      expenseTrend: calculateTrend(currentMonthExpense, prevMonthExpense),
    };
  }, [transactions]);

  if (!isDataLoaded) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-500" role="status" aria-live="polite">Loading your local financial data…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300">
      {/* Ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500/[0.04] rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-500/[0.04] rounded-full blur-[150px] pointer-events-none z-0"></div>

      <div className="relative z-10">
        {currentView === 'landing' ? (
          <LandingPage
            onLaunchApp={() => setCurrentView('dashboard')}
            onOpenPlan={() => setCurrentView('plan')}
            onOpenStatementUpload={() => setIsStatementModalOpen(true)}
          />
        ) : (
          <>
          <Header
            currentView={currentView}
            onChangeView={setCurrentView}
            onManageBudgets={() => setIsBudgetModalOpen(true)}
            onManageDebts={() => setIsDebtModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenStatementUpload={() => setIsStatementModalOpen(true)}
            onOpenGoals={() => setIsGoalsModalOpen(true)}
            alerts={alerts}
            onDismissAlert={handleDismissAlert}
            onSnoozeAlert={handleSnoozeAlert}
            onLoadDemoData={handleLoadDemoData}
            onResetData={handleResetData}
            budgetCount={budgets.length}
            debtCount={debts.length}
          />

          <main className={`container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 ${currentView === 'ai' ? 'max-w-screen-2xl' : 'max-w-7xl'}`}>
            {currentView === 'plan' ? (
              <FinancialPlanPage
                plan={financialPlan}
                goals={savingsGoals}
                onSave={handleSaveFinancialPlan}
                onManageGoals={() => setIsGoalsModalOpen(true)}
              />
            ) : currentView === 'reports' ? (
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
                initialTab={aiSelectedTab}
                onOpenStatementUpload={() => setIsStatementModalOpen(true)}
              />
            ) : (
              <div className="space-y-8 animate-fade-in-up">
                {transactions.length === 0 ? (
                  <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">A clear start</p>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Make this dashboard yours</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Add the goals you’re saving for, your retirement timeline, and any monthly SIP investments. Import a statement or add transactions whenever you’re ready. Nothing is prefilled with made-up finances.</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                        <button onClick={() => setCurrentView('plan')} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">Set up my financial plan</button>
                        <button onClick={() => setIsStatementModalOpen(true)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Import a statement</button>
                        <button onClick={handleOpenForm} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Add a transaction</button>
                      </div>
                    </div>
                  </section>
                ) : (
                  <>
                <AIInsightsWidget transactions={transactions} budgets={budgets} />

                <div className="max-w-3xl mx-auto">
                  <SmartInput onSave={handleAddTransactionFromNLP} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <SummaryCard title="Total Income" amount={totalIncome} colorClass="text-emerald-600" trend={incomeTrend} />
                  <SummaryCard title="Total Expense" amount={totalExpense} colorClass="text-rose-600" trend={expenseTrend} />
                  <SummaryCard title="Balance" amount={balance} colorClass={balance >= 0 ? 'text-slate-900' : 'text-rose-600'} />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative">
                  {/* Left Column: Wealth & Health (4 Cols) */}
                  <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
                    <section>
                      <h2 className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-breathe"></span>
                        Financial Wellness
                      </h2>
                      <FinancialHealthWidget healthScore={healthScore} />
                    </section>

                    <section>
                      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-breathe"></span>
                        Budget Allocation
                      </h2>
                      <BudgetProgress budgets={budgets} transactions={transactions} />
                    </section>
                  </div>

                  {/* Center Column: Activities (5 Cols) */}
                  <div className="lg:col-span-5 space-y-8 order-1 lg:order-2">
                    <section>
                      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-breathe"></span>
                        Recent Activities
                      </h2>
                      <TransactionList transactions={transactions} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} />
                    </section>
                  </div>

                  {/* Right Column: Planning & Goals (3 Cols) */}
                  <div className="lg:col-span-3 space-y-8 order-3">
                    <section>
                      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-breathe"></span>
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
                      <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-3 px-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-breathe"></span>
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
                  </>
                )}
              </div>
            )}
          </main>

          <button
            onClick={handleOpenForm}
            className="fixed bottom-8 right-8 bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white p-4 rounded-2xl shadow-xl shadow-amber-600/25 transition-all duration-300 hover:scale-110 hover:shadow-amber-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 ring-offset-white group animate-pulse-glow z-30"
            aria-label="Add new transaction manually"
          >
            <PlusIcon className="w-7 h-7 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          </>
        )}
      </div>

      <BankStatementUploader
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        onImportTransactions={handleImportStatementTransactions}
      />

      <GoalsConfigurator
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
        goals={savingsGoals}
        transactions={transactions}
        onAddGoal={handleSaveGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
      />

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

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onChangeView={(v) => {
          setCurrentView(v);
        }}
        onOpenNewTransaction={handleOpenForm}
        onOpenBudgets={() => setIsBudgetModalOpen(true)}
        onOpenDebts={() => setIsDebtModalOpen(true)}
        onSelectAITab={(tab) => setAiSelectedTab(tab)}
      />

      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SettingsProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SettingsProvider>
  );
};

export default App;
