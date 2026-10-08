import React, { useState, useEffect } from 'react';
import { Transaction, Budget, Debt, SavingsGoal, FinancialHealthScore } from '../types';
import { evaluateFinancialCouncil, CouncilDeliberation, CouncilMember } from '../services/aiCouncilService';
import { SparklesIcon, BrainIcon, ScaleIcon, ShieldCheckIcon, UserGroupIcon } from './icons';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';

interface AICouncilWidgetProps {
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  healthScore: FinancialHealthScore | null;
}

const PRESET_DILEMMAS = [
  'What should I consider before making a large purchase?',
  'How could I balance an emergency fund and long-term goals?',
  'What would change if I increased my monthly savings?',
  'How do my debt payments affect my monthly cash flow?',
];

const AICouncilWidget: React.FC<AICouncilWidgetProps> = ({
  transactions,
  budgets,
  debts,
  savingsGoals,
  healthScore,
}) => {
  const { currency } = useSettings();
  const { showToast } = useToast();
  const [deliberation, setDeliberation] = useState<CouncilDeliberation | null>(null);
  const [question, setQuestion] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [selectedMember, setSelectedMember] = useState<'maximizer' | 'warden' | 'realist'>('maximizer');

  useEffect(() => {
    // Initial evaluation of user's financial state
    evaluateFinancialCouncil(transactions, budgets, debts, savingsGoals, healthScore, undefined, currency).then(res => {
      setDeliberation(res);
    });
  }, [transactions, budgets, debts, savingsGoals, healthScore, currency]);

  const handleConveneCouncil = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : question).trim();
    if (!q) return;

    setIsDebating(true);
    showToast({
      type: 'info',
      title: 'Council Convened',
      message: 'The 3 advisors are deliberating on your question...',
      duration: 3000,
    });

    try {
      const result = await evaluateFinancialCouncil(
        transactions,
        budgets,
        debts,
        savingsGoals,
        healthScore,
        q,
        currency
      );
      setDeliberation(result);
      showToast({
        type: 'success',
        title: 'Consensus Reached',
        message: `Council Consensus: ${result.consensusScore}/100`,
        duration: 3500,
      });
    } catch (err) {
      console.error('Council debate error:', err);
    } finally {
      setIsDebating(false);
    }
  };

  const getVerdictBadge = (verdict: CouncilMember['verdict']) => {
    switch (verdict) {
      case 'Strongly Endorse':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Approve':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Cautious':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Object':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-white/10 text-gray-300 border-white/20';
    }
  };

  if (!deliberation) {
    return (
      <div className="glass-card p-8 rounded-2xl flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Convening The Aureus Council...</p>
        </div>
      </div>
    );
  }

  const { maximizer, warden, realist } = deliberation.members;

  return (
    <div className="glass-premium p-6 md:p-8 rounded-3xl border border-white/10 space-y-8 relative overflow-hidden shadow-2xl">
      {/* Ambient background decorative glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header & Consensus Strip */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-amber-500 p-[1px] shadow-lg shadow-violet-600/20">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6 text-amber-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">The Aureus Advisory Council</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase tracking-widest">
                Planning perspectives
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Three rule-based viewpoints consider growth, risk, and spending sustainability.
            </p>
          </div>
        </div>

        {/* Consensus Score Gauge Card */}
        <div className="flex items-center gap-4 bg-slate-950/60 border border-white/10 px-5 py-3 rounded-2xl shadow-inner">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-amber-400 transition-all duration-1000"
                strokeDasharray={`${deliberation.consensusScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black text-white tabular-nums">
              {deliberation.consensusScore}%
            </span>
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Consensus Index</p>
            <p className="text-xs font-bold text-emerald-400 mt-0.5">
              {deliberation.consensusScore >= 80 ? 'Strong Alignment' : deliberation.consensusScore >= 60 ? 'Constructive Tension' : 'Divided Verdict'}
            </p>
          </div>
        </div>
      </div>

      {/* Consensus Summary Banner */}
      <div className="relative z-10 bg-gradient-to-r from-violet-950/40 via-slate-900/50 to-amber-950/30 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5" />
            Consensus Synthesis & Strategic Imperative
          </span>
          <p className="text-sm font-semibold text-gray-200">
            {deliberation.primaryAction}
          </p>
          <p className="text-xs text-gray-400">
            {deliberation.consensusSummary}
          </p>
        </div>
      </div>

      {/* The 3 Advisor Cards */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Advisor 1: The Wealth Maximizer */}
        <div className="bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-amber-500/20">
                  WM
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{maximizer.name}</h3>
                  <p className="text-[10px] text-amber-400/80 font-medium">{maximizer.role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getVerdictBadge(maximizer.verdict)}`}>
                {maximizer.verdict}
              </span>
            </div>

            <p className="text-xs italic text-gray-400 border-l-2 border-amber-500/40 pl-2.5 py-0.5">
              "{maximizer.quote}"
            </p>

            <p className="text-xs text-gray-300 leading-relaxed">
              {maximizer.analysis}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Action Directives</p>
              {maximizer.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advisor 2: The Risk Warden */}
        <div className="bg-slate-900/60 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-500/20">
                  RW
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{warden.name}</h3>
                  <p className="text-[10px] text-blue-400/80 font-medium">{warden.role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getVerdictBadge(warden.verdict)}`}>
                {warden.verdict}
              </span>
            </div>

            <p className="text-xs italic text-gray-400 border-l-2 border-blue-500/40 pl-2.5 py-0.5">
              "{warden.quote}"
            </p>

            <p className="text-xs text-gray-300 leading-relaxed">
              {warden.analysis}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Risk Mitigation Directives</p>
              {warden.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                  <span className="text-blue-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advisor 3: The Lifestyle Realist */}
        <div className="bg-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-emerald-500/20">
                  LR
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{realist.name}</h3>
                  <p className="text-[10px] text-emerald-400/80 font-medium">{realist.role}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getVerdictBadge(realist.verdict)}`}>
                {realist.verdict}
              </span>
            </div>

            <p className="text-xs italic text-gray-400 border-l-2 border-emerald-500/40 pl-2.5 py-0.5">
              "{realist.quote}"
            </p>

            <p className="text-xs text-gray-300 leading-relaxed">
              {realist.analysis}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Sustainability Directives</p>
              {realist.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-gray-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Council Dilemma Input */}
      <div className="relative z-10 bg-slate-950/70 border border-white/10 rounded-2xl p-5 space-y-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <ScaleIcon className="w-4 h-4 text-violet-400" />
            Convene Council On A Specific Decision
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">
            Submit a major purchase, life transition, or budgeting question to trigger persona deliberation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConveneCouncil()}
            placeholder="Ask about a goal, purchase, savings plan, or debt scenario"
            className="flex-1 glass-input px-4 py-2.5 rounded-xl text-xs text-white"
            disabled={isDebating}
          />
          <button
            onClick={() => handleConveneCouncil()}
            disabled={isDebating || !question.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-violet-600/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isDebating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Debating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-3.5 h-3.5" />
                <span>Debate Question</span>
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">If cloud AI is configured, your question and summarized financial figures are sent to Google Gemini. Otherwise, this uses local rules. This tool is for planning, not personalized investment advice.</p>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider whitespace-nowrap">Suggested:</span>
          {PRESET_DILEMMAS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(preset);
                handleConveneCouncil(preset);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 transition-colors whitespace-nowrap"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AICouncilWidget;
