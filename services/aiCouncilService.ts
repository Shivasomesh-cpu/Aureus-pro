import { Transaction, Budget, Debt, SavingsGoal, FinancialHealthScore, TransactionType } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface CouncilMember {
  id: 'maximizer' | 'warden' | 'realist';
  name: string;
  role: string;
  avatarColor: string;
  quote: string;
  verdict: 'Approve' | 'Cautious' | 'Object' | 'Strongly Endorse';
  sentimentScore: number; // 0 - 100
  analysis: string;
  recommendations: string[];
}

export interface CouncilDeliberation {
  consensusScore: number; // 0 - 100
  consensusSummary: string;
  primaryAction: string;
  members: Record<'maximizer' | 'warden' | 'realist', CouncilMember>;
  debateQuestion?: string;
  userPrompt?: string;
}

const geminiApiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY || '').trim();
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

/**
 * Generate Multi-Agent Council Evaluation for user finances
 */
export async function evaluateFinancialCouncil(
  transactions: Transaction[],
  budgets: Budget[],
  debts: Debt[],
  goals: SavingsGoal[],
  healthScore: FinancialHealthScore | null,
  customQuery?: string,
  currencyCode = 'USD'
): Promise<CouncilDeliberation> {
  // Compute core financial metrics for the council
  const incomeTxs = transactions.filter(t => t.type === TransactionType.INCOME);
  const expenseTxs = transactions.filter(t => t.type === TransactionType.EXPENSE);

  const totalIncome = incomeTxs.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseTxs.reduce((s, t) => s + t.amount, 0);
  const distinctMonths = Math.max(1, new Set(transactions.map(t => t.date.slice(0, 7))).size);
  const avgMonthlyIncome = totalIncome / distinctMonths;
  const avgMonthlyExpense = totalExpense / distinctMonths;
  const netMonthlyCashFlow = avgMonthlyIncome - avgMonthlyExpense;
  const savingsRate = avgMonthlyIncome > 0 ? Math.max(0, (netMonthlyCashFlow / avgMonthlyIncome) * 100) : 0;

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const emergencyGoal = goals.find(g => g.name.toLowerCase().includes('emergency'));
  const emergencyBalance = emergencyGoal ? emergencyGoal.currentAmount : 0;
  const emergencyRunwayMonths = avgMonthlyExpense > 0 ? emergencyBalance / avgMonthlyExpense : null;

  // If Gemini API is available and customQuery is provided, call Gemini for rich dynamic council deliberation
  if (ai && customQuery && customQuery.trim().length > 0) {
    try {
      const prompt = `You are the Aureus Multi-Agent Financial Advisory Council composed of three distinct experts:
1. The Growth Planner (Reviews long-term goals and contribution consistency without recommending securities).
2. The Risk Reviewer (Highlights emergency savings, debt costs, and uncertainty).
3. The Lifestyle Planner (Considers whether a plan leaves room for day-to-day needs and flexibility).

User's Financial Profile:
- Monthly Net Cash Flow: ${currencyCode} ${netMonthlyCashFlow.toFixed(0)} (Savings Rate: ${savingsRate.toFixed(1)}%)
- Total Debt: ${currencyCode} ${totalDebt.toFixed(0)} across ${debts.length} accounts
- Emergency Fund: ${currencyCode} ${emergencyBalance.toFixed(0)} (${emergencyRunwayMonths === null ? 'expense history unavailable' : `${emergencyRunwayMonths.toFixed(1)} months of expenses`})
- Financial Health Index: ${healthScore?.overallScore ?? 'not available'}${healthScore ? '/100' : ''}

User's Question / Decision to Debate:
"${customQuery}"

Respond strictly as JSON with this structure:
{
  "consensusScore": <number 0-100>,
  "consensusSummary": "<concise summary of council agreement>",
  "primaryAction": "<clear unanimous recommendation>",
  "members": {
    "maximizer": {
      "verdict": "<Approve|Cautious|Object|Strongly Endorse>",
      "sentimentScore": <0-100>,
      "analysis": "<detailed paragraph in character>",
      "recommendations": ["<action 1>", "<action 2>"]
    },
    "warden": {
      "verdict": "<Approve|Cautious|Object|Strongly Endorse>",
      "sentimentScore": <0-100>,
      "analysis": "<detailed paragraph in character>",
      "recommendations": ["<action 1>", "<action 2>"]
    },
    "realist": {
      "verdict": "<Approve|Cautious|Object|Strongly Endorse>",
      "sentimentScore": <0-100>,
      "analysis": "<detailed paragraph in character>",
      "recommendations": ["<action 1>", "<action 2>"]
    }
  }
Do not recommend specific stocks, funds, securities, or transactions. State uncertainty and do not present estimates as guarantees.
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const parsed = JSON.parse(res.text || '{}');
      if (parsed.members && parsed.members.maximizer) {
        return {
          consensusScore: parsed.consensusScore || 75,
          consensusSummary: parsed.consensusSummary || 'Council deliberation concluded.',
          primaryAction: parsed.primaryAction || 'Align your cash flow with long-term goals.',
          debateQuestion: customQuery,
          userPrompt: customQuery,
          members: {
            maximizer: {
              id: 'maximizer',
              name: 'The Wealth Maximizer',
              role: 'Compounding & Capital Growth',
              avatarColor: 'from-amber-500 to-yellow-600',
              quote: 'Every idle dollar is an employee that refused to clock in.',
              verdict: parsed.members.maximizer.verdict || 'Approve',
              sentimentScore: parsed.members.maximizer.sentimentScore || 80,
              analysis: parsed.members.maximizer.analysis || '',
              recommendations: parsed.members.maximizer.recommendations || [],
            },
            warden: {
              id: 'warden',
              name: 'The Risk Warden',
              role: 'Liquidity & Fragility Defense',
              avatarColor: 'from-blue-600 to-indigo-700',
              quote: 'Surviving volatility is the prerequisite to compound interest.',
              verdict: parsed.members.warden.verdict || 'Cautious',
              sentimentScore: parsed.members.warden.sentimentScore || 65,
              analysis: parsed.members.warden.analysis || '',
              recommendations: parsed.members.warden.recommendations || [],
            },
            realist: {
              id: 'realist',
              name: 'The Lifestyle Realist',
              role: 'Sustainability & Habit Pacing',
              avatarColor: 'from-emerald-500 to-teal-600',
              quote: 'An unsustainable budget is a ticking time bomb.',
              verdict: parsed.members.realist.verdict || 'Approve',
              sentimentScore: parsed.members.realist.sentimentScore || 78,
              analysis: parsed.members.realist.analysis || '',
              recommendations: parsed.members.realist.recommendations || [],
            },
          }
        };
      }
    } catch (err) {
      console.warn('AI Council Gemini API fallback engaged:', err);
    }
  }

  // High-Precision Deterministic Multi-Agent Analytical Engine
  return generateDeterministicCouncil(
    savingsRate,
    netMonthlyCashFlow,
    totalDebt,
    emergencyRunwayMonths,
    healthScore?.overallScore ?? 50,
    customQuery
  );
}

function generateDeterministicCouncil(
  savingsRate: number,
  netCashFlow: number,
  totalDebt: number,
  emergencyMonths: number | null,
  score: number,
  customQuery?: string
): CouncilDeliberation {
  // Wealth Maximizer persona evaluation
  let maxScore = 50 + (savingsRate * 1.2);
  let maxVerdict: 'Approve' | 'Cautious' | 'Object' | 'Strongly Endorse' = 'Approve';
  let maxAnalysis = '';
  let maxRecs: string[] = [];

  if (savingsRate >= 30) {
    maxVerdict = 'Strongly Endorse';
    maxScore = Math.min(95, maxScore);
    maxAnalysis = `Your ${savingsRate.toFixed(1)}% savings rate leaves room to review how your monthly plan supports the goals you entered. The projection depends on assumptions and is not guaranteed.`;
    maxRecs = [
      'Check that recurring contributions match the goals and time horizon you selected.',
      'Review your return assumptions periodically; actual results can differ substantially.',
    ];
  } else if (savingsRate >= 15) {
    maxVerdict = 'Approve';
    maxAnalysis = `Your recorded savings rate is ${savingsRate.toFixed(1)}%, with an estimated monthly surplus of ${netCashFlow.toFixed(0)} in your selected currency. The calculation reflects only the transactions you entered.`;
    maxRecs = [
      'Target lifting savings rate from ' + savingsRate.toFixed(0) + '% to 25% by auditing variable subscriptions.',
      'Compare your recurring contributions with your savings goals and monthly cash flow.',
    ];
  } else {
    maxVerdict = 'Object';
    maxScore = Math.max(30, maxScore);
    maxAnalysis = `Your recorded savings rate is ${savingsRate.toFixed(1)}%. A short transaction history or missing income can make this estimate incomplete.`;
    maxRecs = [
      'Review optional spending and choose any changes that fit your priorities.',
      'Consider whether a small, sustainable savings target fits your budget.',
    ];
  }

  // Risk Warden persona evaluation
  let wardenScore = 60;
  let wardenVerdict: 'Approve' | 'Cautious' | 'Object' | 'Strongly Endorse' = 'Cautious';
  let wardenAnalysis = '';
  let wardenRecs: string[] = [];

  if (emergencyMonths !== null && emergencyMonths < 3) {
    wardenVerdict = 'Object';
    wardenScore = 38;
    wardenAnalysis = `CRITICAL FRAGILITY: You hold only ${emergencyMonths.toFixed(1)} months of emergency expense coverage. An unexpected medical bill, layoff, or auto expense could force you into high-interest debt or liquidation.`;
    wardenRecs = [
      `Aggressively build emergency reserves to at least 3 full months of living expenses.`,
      `Place emergency capital in a high-yield savings account (HYSA) separate from daily checking.`,
    ];
  } else if (totalDebt > 0) {
    wardenVerdict = 'Cautious';
    wardenScore = 58;
    wardenAnalysis = `Your entered debt totals ${totalDebt.toFixed(0)} in the selected currency. Interest rates and minimum payments affect the cost and timeline.`;
    wardenRecs = [
      'Deploy the mathematical Avalanche method to eradicate highest-APR balances first.',
      'Freeze new revolving credit card charges until high-interest accounts reach zero.',
    ];
  } else if (emergencyMonths !== null) {
    wardenVerdict = 'Approve';
    wardenScore = 88;
    wardenAnalysis = `Your entered records show ${emergencyMonths.toFixed(1)} months of emergency expense coverage and ${totalDebt.toFixed(0)} in debt in the selected currency.`;
    wardenRecs = [
      'Maintain existing emergency runway in risk-free liquid yields.',
      'Conduct a quarterly insurance and downside liability review.',
    ];
  } else {
    wardenVerdict = 'Cautious';
    wardenScore = 60;
    wardenAnalysis = 'There is not enough expense history to estimate emergency fund coverage.';
    wardenRecs = ['Add regular expense records to estimate your essential monthly costs.', 'Use your own expenses to choose an emergency savings target.'];
  }

  // Lifestyle Realist persona evaluation
  let realistScore = 75;
  let realistVerdict: 'Approve' | 'Cautious' | 'Object' | 'Strongly Endorse' = 'Approve';
  let realistAnalysis = '';
  let realistRecs: string[] = [];

  if (savingsRate > 50) {
    realistVerdict = 'Cautious';
    realistScore = 65;
    realistAnalysis = `While your financial metrics are stellar, extreme austerity frequently triggers budget fatigue. Ensure you allocate a deliberate, guilt-free 'fun & joy' fund so your lifestyle remains satisfying for the long haul.`;
    realistRecs = [
      'Allocate 10% of monthly surplus to guilt-free recreation, travel, or personal hobbies.',
      'Celebrate financial milestones deliberately to avoid burnout.',
    ];
  } else if (savingsRate < 10) {
    realistVerdict = 'Object';
    realistScore = 45;
    realistAnalysis = `Living near cash-flow parity induces constant background stress. You deserve peace of mind. Small adjustments in food delivery and repetitive subscriptions will restore breathing room without sacrificing joy.`;
    realistRecs = [
      'Identify 2 subscription or dining habits that bring the lowest satisfaction and swap them for high-value alternatives.',
      'Choose a small savings target only if it fits your regular expenses.',
    ];
  } else {
    realistVerdict = 'Approve';
    realistScore = 82;
    realistAnalysis = `Your spending exhibits healthy real-world balance. You are saving consistently while maintaining room for living well today. Consistency beats extreme restriction every time.`;
    realistRecs = [
      'Maintain your current dining and recreation boundaries.',
      'Plan semi-annual reward milestones when savings goals hit key targets.',
    ];
  }

  const consensusScore = Math.round((maxScore + wardenScore + realistScore) / 3);

  let primaryAction = 'Review how your monthly plan balances emergency savings, debt costs, and your goals.';
  if (emergencyMonths !== null && emergencyMonths < 3) {
    primaryAction = 'Review your emergency savings target against your essential monthly expenses.';
  } else if (totalDebt > 0) {
    primaryAction = 'Compare interest rates and payoff timelines before choosing how to allocate extra payments.';
  }

  return {
    consensusScore,
    consensusSummary: `Council Consensus (${consensusScore}/100): The panel agrees your financial foundation is ${consensusScore >= 75 ? 'robust and primed for expansion' : 'functional with strategic opportunities for optimization'}.`,
    primaryAction,
    debateQuestion: customQuery || 'Overall Financial Trajectory & Strategic Allocation',
    userPrompt: customQuery,
    members: {
      maximizer: {
        id: 'maximizer',
        name: 'The Wealth Maximizer',
        role: 'Compounding & Capital Growth',
        avatarColor: 'from-amber-500 to-yellow-600',
        quote: 'Every idle dollar is an employee that refused to clock in.',
        verdict: maxVerdict,
        sentimentScore: Math.round(maxScore),
        analysis: maxAnalysis,
        recommendations: maxRecs,
      },
      warden: {
        id: 'warden',
        name: 'The Risk Warden',
        role: 'Liquidity & Fragility Defense',
        avatarColor: 'from-blue-600 to-indigo-700',
        quote: 'Surviving volatility is the prerequisite to compound interest.',
        verdict: wardenVerdict,
        sentimentScore: Math.round(wardenScore),
        analysis: wardenAnalysis,
        recommendations: wardenRecs,
      },
      realist: {
        id: 'realist',
        name: 'The Lifestyle Realist',
        role: 'Sustainability & Habit Pacing',
        avatarColor: 'from-emerald-500 to-teal-600',
        quote: 'An unsustainable budget is a ticking time bomb.',
        verdict: realistVerdict,
        sentimentScore: Math.round(realistScore),
        analysis: realistAnalysis,
        recommendations: realistRecs,
      },
    }
  };
}
