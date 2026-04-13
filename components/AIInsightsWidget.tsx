import React, { useState, useEffect } from 'react';
import { Transaction, Budget, FinancialInsight } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { calculateSpendingPrediction, detectAnomalies, runMonteCarloSimulation, getBudgetOptimization, calculateHealthScores, generateAnalysisNarrative } from '../services/aiAnalyticsService';
import AISimulationChart from './AISimulationChart';
import FinancialHealthRadar from './FinancialHealthRadar';
import { SparklesIcon, LightBulbIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon, ChartBarIcon, DocumentArrowDownIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface AIInsightsWidgetProps {
    transactions: Transaction[];
    budgets: Budget[];
}

const AIInsightsWidget: React.FC<AIInsightsWidgetProps> = ({ transactions, budgets }) => {
    const { formatCurrency } = useSettings();
    const [insights, setInsights] = useState<FinancialInsight[]>([]);
    const [loading, setLoading] = useState(false);
    const [simulationData, setSimulationData] = useState<any[] | null>(null);
    const [optimizations, setOptimizations] = useState<any[]>([]);
    const [healthData, setHealthData] = useState<any[]>([]);
    const [narrative, setNarrative] = useState<string>('');

    useEffect(() => {
        const fetchInsights = async () => {
            if (transactions.length === 0) return;

            setLoading(true);

            // 1. Fetch Gemini Insights (Optional / Fallback)
            const data = await getFinancialInsights(transactions, budgets);

            // 2. Fetch Local AI Analytics
            const localAnomalies = detectAnomalies(transactions);
            const prediction = calculateSpendingPrediction(transactions);
            const optimization = getBudgetOptimization(budgets, transactions);
            const healthScores = calculateHealthScores(transactions, budgets);
            const analysisText = generateAnalysisNarrative(healthScores);

            // 3. Run Monte Carlo Simulation
            const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const avgMonthlyIncome = transactions.length > 0 ? (totalIncome / (Math.max(1, transactions.length / 30))) : 5000;
            const currentBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

            const sim = runMonteCarloSimulation(currentBalance, avgMonthlyIncome, transactions);

            setInsights([...localAnomalies, ...data, {
                type: 'prediction',
                message: `Pace analysis: You are on track to spend ${formatCurrency(prediction)} this month.`
            }]);
            setSimulationData(sim);
            setOptimizations(optimization);
            setHealthData(healthScores);
            setNarrative(analysisText);
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchInsights, 2000);
        return () => clearTimeout(timeoutId);

    }, [transactions.length, budgets.length, formatCurrency]);

    if (transactions.length < 5) {
        return (
            <div className="glass-card p-6 rounded-2xl mb-8 flex items-center gap-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">AI Insights</h3>
                    <p className="text-sm text-gray-400">Add a few more transactions to unlock personalized financial advice.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-2xl mb-8 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">AI Financial Assistant</h3>
                {loading && <span className="text-xs text-indigo-400 animate-pulse ml-auto">Analyzing finances...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl hover:bg-slate-800/60 transition-colors backdrop-blur-sm shadow-md">
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${insight.type === 'alert' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                insight.type === 'prediction' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                {insight.type === 'alert' && <ExclamationTriangleIcon className="w-5 h-5" />}
                                {insight.type === 'prediction' && <ArrowTrendingUpIcon className="w-5 h-5" />}
                                {insight.type === 'tip' && <LightBulbIcon className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 font-sans">{insight.type}</p>
                                <p className="text-sm text-gray-200 leading-relaxed font-medium">{insight.message}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Simulation Chart Section */}
                <div className="lg:col-span-2 bg-slate-800/40 border border-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                    <AISimulationChart data={simulationData || []} />
                </div>

                {/* Radar & Health Section */}
                <div className="lg:col-span-1 bg-slate-800/40 border border-white/5 p-6 rounded-2xl shadow-lg backdrop-blur-sm flex flex-col justify-between">
                    <FinancialHealthRadar data={healthData} />
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <DocumentArrowDownIcon className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Chief Advisor's Analysis</h4>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                            "{narrative}"
                        </p>
                    </div>
                </div>

                {/* Optimization & Intelligence Section (Full Width Now) */}
                <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-4">
                        <ChartBarIcon className="w-5 h-5 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider">Smart Budget Recommendations</h4>
                    </div>

                    {optimizations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {optimizations.map((opt, idx) => (
                                <div key={idx} className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl hover:bg-emerald-500/10 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-medium text-emerald-400">{opt.category}</span>
                                        <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/20">-{Math.round((1 - opt.suggested / opt.current) * 100)}% Cut</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-3 h-8 line-clamp-2">{opt.reason}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${(opt.suggested / opt.current) * 100}%` }}></div>
                                        </div>
                                        <span className="text-[10px] text-gray-500 font-mono">{formatCurrency(opt.current)} → {formatCurrency(opt.suggested)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-dashed border-white/10">
                            <p className="text-xs text-gray-500">Collect more transaction data to enable budget optimization algorithms.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInsightsWidget;
