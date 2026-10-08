import React, { useState, useMemo } from 'react';
import { SavingsGoal, Transaction, TransactionType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { TargetIcon, PlusIcon, SparklesIcon, TrashIcon, XMarkIcon, CheckIcon } from './icons';

interface GoalsConfiguratorProps {
  isOpen: boolean;
  onClose: () => void;
  goals: SavingsGoal[];
  transactions: Transaction[];
  onAddGoal: (goal: SavingsGoal) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
}

const PRESET_TEMPLATES = [
  { name: '🛡️ 3-Month Emergency Reserve', amount: 15000, months: 12, color: '#10b981' },
  { name: '🏡 Home Down Payment Fund', amount: 45000, months: 36, color: '#3b82f6' },
  { name: '✈️ Sabbatical & World Travel', amount: 8000, months: 14, color: '#f59e0b' },
  { name: '📈 First investment milestone', amount: 100000, months: 60, color: '#8b5cf6' },
];

const GoalsConfigurator: React.FC<GoalsConfiguratorProps> = ({
  isOpen,
  onClose,
  goals,
  transactions,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const { formatCurrency } = useSettings();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(10000);
  const [currentAmount, setCurrentAmount] = useState<number>(1500);
  const [deadlineMonths, setDeadlineMonths] = useState<number>(18);
  const [color, setColor] = useState('#10b981');

  // Estimate monthly surplus
  const monthlySurplus = useMemo(() => {
    const distinctMonths = Math.max(1, new Set(transactions.map(t => t.date.slice(0, 7))).size);
    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) inc += t.amount;
      else exp += t.amount;
    });
    return Math.max(0, (inc - exp) / distinctMonths);
  }, [transactions]);

  if (!isOpen) return null;

  const requiredMonthlyContribution = Math.max(
    0,
    Math.round(((targetAmount - currentAmount) / Math.max(1, deadlineMonths)) * 100) / 100
  );

  const feasibilityRatio = monthlySurplus > 0 ? requiredMonthlyContribution / monthlySurplus : 1;

  const handleCreateGoal = () => {
    if (!name.trim() || targetAmount <= 0) return;

    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + deadlineMonths);

    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      targetAmount,
      currentAmount,
      deadline: deadline.toISOString().split('T')[0],
      color,
    };

    onAddGoal(newGoal);

    setIsCreating(false);
    setName('');
  };

  const handleApplyTemplate = (tpl: typeof PRESET_TEMPLATES[0]) => {
    setName(tpl.name);
    setTargetAmount(tpl.amount);
    setCurrentAmount(0);
    setDeadlineMonths(tpl.months);
    setColor(tpl.color);
    setIsCreating(true);
  };

  const handleDeposit = (goal: SavingsGoal, delta: number) => {
    const updatedAmount = Math.min(goal.targetAmount, goal.currentAmount + delta);
    const updated = { ...goal, currentAmount: updatedAmount };
    onUpdateGoal(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
              <TargetIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Strategic Wealth Targets</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                  Goal Architect
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure timeline-backed savings objectives with monthly cash-flow feasibility analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 md:p-6 space-y-6 custom-scrollbar flex-1">
          {/* Cash Flow Feasibility Strip */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Estimated Monthly Surplus</p>
              <p className="text-lg font-bold text-emerald-700 tabular-nums">+{formatCurrency(monthlySurplus)}/month</p>
            </div>
            <p className="text-xs text-slate-500 max-w-md">
              Aureus dynamically compares goal contribution velocity against your historical cash surplus to ensure targets are realistic and stress-free.
            </p>
          </div>

          {/* Goal List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Active Objectives</h3>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                {isCreating ? 'Cancel' : 'New Goal'}
              </button>
            </div>

            {/* Creation Form */}
            {isCreating && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fade-in-up">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Configure New Objective</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Goal Title</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. 6-Month Emergency Fund"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Target Amount</label>
                    <input
                      type="number"
                      value={targetAmount || ''}
                      onChange={e => setTargetAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Current Saved</label>
                    <input
                      type="number"
                      value={currentAmount || ''}
                      onChange={e => setCurrentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Timeline (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={deadlineMonths || ''}
                      onChange={e => setDeadlineMonths(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-1 block">Accent Color</label>
                    <select
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none bg-white"
                    >
                      <option value="#10b981">Emerald Green</option>
                      <option value="#3b82f6">Ocean Blue</option>
                      <option value="#f59e0b">Amber Gold</option>
                      <option value="#8b5cf6">Royal Violet</option>
                      <option value="#ec4899">Rose Pink</option>
                    </select>
                  </div>
                </div>

                {/* Feasibility Alert */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-700">
                      Required Pace: <strong className="text-slate-900">{formatCurrency(requiredMonthlyContribution)}/mo</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {feasibilityRatio <= 0.5
                        ? `✨ Highly Feasible (uses only ${Math.round(feasibilityRatio * 100)}% of your monthly cash surplus)`
                        : feasibilityRatio <= 1.0
                        ? `⚖️ Balanced (uses ${Math.round(feasibilityRatio * 100)}% of monthly cash surplus)`
                        : `⚠️ Requires +${formatCurrency(requiredMonthlyContribution - monthlySurplus)}/mo extra cash flow`}
                    </p>
                  </div>
                  <button
                    onClick={handleCreateGoal}
                    disabled={!name.trim() || targetAmount <= 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            )}

            {/* Quick Templates */}
            {!isCreating && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Quick-Start Goal Archetypes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_TEMPLATES.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => handleApplyTemplate(tpl)}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-left transition-all group shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {tpl.name}
                        </span>
                        <span className="text-xs font-bold text-slate-700 tabular-nums">
                          {formatCurrency(tpl.amount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {tpl.months} months • ~{formatCurrency(tpl.amount / tpl.months)}/mo
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of existing goals */}
            {goals.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs text-slate-500">No active savings targets configured.</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-xs text-indigo-600 font-bold underline"
                >
                  Create your first goal now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map(goal => {
                  const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                  return (
                    <div key={goal.id} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: goal.color }} />
                          <h4 className="text-sm font-bold text-slate-900">{goal.name}</h4>
                          <span className="text-[10px] font-bold text-slate-500">
                            Deadline: {goal.deadline}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDeposit(goal, 100)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                          >
                            +{formatCurrency(100)}
                          </button>
                          <button
                            onClick={() => handleDeposit(goal, 500)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                          >
                            +{formatCurrency(500)}
                          </button>
                          <button
                            onClick={() => onDeleteGoal(goal.id)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors ml-1"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%`, backgroundColor: goal.color }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 tabular-nums">
                          <span>{formatCurrency(goal.currentAmount)} ({percent}%)</span>
                          <span>Target: {formatCurrency(goal.targetAmount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsConfigurator;
