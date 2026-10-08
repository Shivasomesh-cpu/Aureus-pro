import React, { useMemo, useRef } from 'react';
import { Transaction, TransactionType, Category } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { ArrowTrendingUpIcon, ChartBarIcon, DocumentArrowDownIcon, GreekPillarIcon, PlusIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';
import { saveTransactions, getTransactions } from '../services/storageService';

interface ReportsProps {
  transactions: Transaction[];
}

const COLORS = ['#059669', '#ef4444', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6', '#f97316', '#6b7280'];

const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const { formatCurrency } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { expenseByCategory, incomeVsExpenseByMonth, kpiData } = useMemo(() => {
    const expenses: { name: Category; value: number }[] = [];
    const categoryMap = new Map<Category, number>();
    const monthMap = new Map<string, { month: string; key: string; income: number; expense: number }>();

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      // Category Logic
      if (t.type === TransactionType.EXPENSE) {
        categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        totalExpense += t.amount;
      } else {
        totalIncome += t.amount;
      }

      // Monthly Logic
      const monthKey = t.date.slice(0, 7);
      if (!monthMap.has(monthKey)) {
        const [yearStr, monthStr] = monthKey.split('-');
        const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
        const label = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        monthMap.set(monthKey, { month: label, key: monthKey, income: 0, expense: 0 });
      }
      const entry = monthMap.get(monthKey)!;
      if (t.type === TransactionType.INCOME) entry.income += t.amount;
      else entry.expense += t.amount;
    });

    categoryMap.forEach((value, name) => expenses.push({ name, value }));
    const sortedExpenses = expenses.sort((a, b) => b.value - a.value);
    const sortedMonths = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key));

    // KPI Calculations
    const netCashFlow = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    const topExpense = sortedExpenses.length > 0 ? sortedExpenses[0] : null;

    return {
      expenseByCategory: sortedExpenses,
      incomeVsExpenseByMonth: sortedMonths,
      kpiData: { netCashFlow, savingsRate, topExpense, totalIncome, totalExpense }
    };
  }, [transactions]);


  const exportToCSV = () => {
    const headers = "ID,Date,Day,Time,Month,Year,Type,Category,Description,Amount,AI Generated,Confidence";
    const rows = transactions.map(t => {
      const dateObj = new Date(t.date);
      const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const month = dateObj.toLocaleDateString('en-US', { month: 'long' });
      const year = dateObj.getFullYear();
      const time = "12:00 PM"; // Placeholder as time isn't stored
      return [
        t.id,
        t.date,
        day,
        time,
        month,
        year,
        t.type,
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.aiGenerated ? 'Yes' : 'No',
        t.aiGenerated ? 'High' : 'Manual'
      ].join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);

        // Simple CSV line parser to handle quoted strings (like descriptions with commas)
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current);
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current);
          return result;
        };

        const newTransactions: Transaction[] = [];
        let successCount = 0;

        // Determine format from header
        const header = lines[0].toLowerCase();
        const isDetailedFormat = header.includes('id,date,day');

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = parseCSVLine(line);

          let date, description, amount, typeStr, category;

          if (isDetailedFormat && parts.length >= 10) {
            // Detailed format: ID,Date,Day,Time,Month,Year,Type,Category,Description,Amount...
            date = parts[1];
            typeStr = parts[6].toLowerCase();
            category = parts[7];
            description = parts[8];
            amount = parseFloat(parts[9]);
          } else if (parts.length >= 3) {
            // Legacy / Simple format: Date,Description,Amount,Type,Category
            date = parts[0];
            description = parts[1];
            amount = parseFloat(parts[2]);
            typeStr = parts[3]?.toLowerCase();
            category = parts[4];
          } else {
            continue;
          }

          if (!isNaN(amount)) {
            newTransactions.push({
              id: isDetailedFormat && parts[0] ? parts[0] : crypto.randomUUID(),
              date: date || new Date().toISOString().split('T')[0],
              description: description || 'Imported Transaction',
              amount: Math.abs(amount),
              type: typeStr?.includes('income') ? TransactionType.INCOME : TransactionType.EXPENSE,
              category: (category || 'Uncategorized') as Category,
              aiGenerated: isDetailedFormat ? parts[10]?.toLowerCase() === 'yes' : false
            });
            successCount++;
          }
        }

        if (newTransactions.length > 0) {
          const current = getTransactions();
          // Filter out duplicates based on ID if present
          const existingIds = new Set(current.map(t => t.id));
          const nonDuplicates = newTransactions.filter(t => !existingIds.has(t.id));

          if (nonDuplicates.length === 0) {
            alert('ℹ️ All transactions in the file are already in your history.');
            return;
          }

          const updated = [...current, ...nonDuplicates];
          saveTransactions(updated);
          alert(`✅ Successfully imported ${nonDuplicates.length} new transactions!`);
          window.location.reload();
        } else {
          alert('⚠️ No valid transactions found in CSV. Please ensure correct format.');
        }

      } catch (err) {
        console.error('Import failed', err);
        alert('❌ Failed to parse CSV. Please check the file format.');
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight font-serif">Financial Analytics</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Performance & Insights</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv"
          />
          <button onClick={handleImportClick} className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-950 bg-gradient-to-r from-indigo-200 to-indigo-500 hover:from-indigo-300 hover:to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
            <DocumentArrowDownIcon className="w-4 h-4 rotate-180" />
            Import Data
          </button>
          <button onClick={exportToCSV} className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-950 bg-gradient-to-r from-amber-200 to-amber-500 hover:from-amber-300 hover:to-amber-600 rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-105">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Net Cash Flow</h4>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            {formatCurrency(kpiData.netCashFlow)}
            <span className={`text-xs ${kpiData.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {kpiData.netCashFlow >= 0 ? '+Surplus' : '-Deficit'}
            </span>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-indigo-500">
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Savings Rate</h4>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            {kpiData.savingsRate.toFixed(1)}%
            <span className="text-xs text-slate-500">of Income</span>
          </div>
          <div className="w-full bg-slate-700 h-1 mt-3 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(kpiData.savingsRate, 100)}%` }}></div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500">
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-2">Top Expense</h4>
          <div className="text-2xl font-bold text-white truncate">
            {kpiData.topExpense ? kpiData.topExpense.name : 'None'}
          </div>
          {kpiData.topExpense && (
            <div className="text-xs text-rose-400 mt-1">
              {formatCurrency(kpiData.topExpense.value)}
              {kpiData.totalExpense > 0 && (
                <span className="text-slate-500 ml-1">({((kpiData.topExpense.value / kpiData.totalExpense) * 100).toFixed(0)}% of spend)</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Expense Distribution</h3>
              <p className="text-xs text-slate-400 mt-1">Category Breakdown</p>
            </div>
            <ChartBarIcon className="w-5 h-5 text-slate-600" />
          </div>

          {expenseByCategory.length > 0 ? (
            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} stroke="none">
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-gray-400 py-16">No expense data available.</p>}
        </div>

        <div className="lg:col-span-3 glass-card p-6 rounded-2xl relative">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Cash Flow Trend</h3>
              <p className="text-xs text-slate-400 mt-1">Income vs Expenses (Monthly)</p>
            </div>
            <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-500" />
          </div>
          {incomeVsExpenseByMonth.length > 0 ? (
            <div style={{ width: '100%', height: 300, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenseByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(value: number) => formatCurrency(value)} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-center text-gray-400 py-16">No transaction data available.</p>}
        </div>
      </div>

      {/* Comprehensive Financial Essay */}
      {transactions.length > 0 && (
        <div className="glass-card p-8 rounded-2xl relative overflow-hidden mt-8 border border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <GreekPillarIcon className="w-64 h-64 text-amber-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <GreekPillarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-serif tracking-tight">Chief Financial Essay</h3>
                <p className="text-xs text-amber-500/80 uppercase tracking-[0.2em] font-medium">Comprehensive Analysis & Strategy</p>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-300 leading-relaxed font-light text-sm md:text-base text-justify">
                <p>
                  <strong className="text-white block mb-2 text-lg">Financial Snapshot</strong>
                  Let's look at the big picture: for this period,
                  <span className={kpiData.netCashFlow >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}> {kpiData.netCashFlow >= 0 ? "you earned more than you spent" : "you spent more than you earned"}</span>.
                  Specifically, you have a <strong>{formatCurrency(Math.abs(kpiData.netCashFlow))} {kpiData.netCashFlow >= 0 ? "surplus" : "deficit"}</strong> remaining.
                  You saved about <strong>{kpiData.savingsRate.toFixed(1)}%</strong> of your income. {kpiData.savingsRate > 20 ? "That is an excellent result—saving over 20% puts you on the fast track to financial freedom." : "A healthy target is usually 20%, so try to find small ways to bridge that gap next month."}
                </p>

                <p>
                  <strong className="text-white block mb-2 text-lg">Where Your Money Went</strong>
                  Your biggest expense category was <strong>{kpiData.topExpense?.name || 'Unknown'}</strong>.
                  {kpiData.topExpense?.name === 'Housing' || kpiData.topExpense?.name === 'Food' ?
                    " Since this is an essential cost, ensure you are getting the best value, but don't worry too much about cutting it deeply." :
                    " Because this is a discretionary category (wants, not needs), this is the easiest place to save money. Cutting this back by just 10% could make a huge difference to your savings."}
                  It's important to keep an eye on this number to make sure it doesn't eat up too much of your budget.
                </p>

                <p>
                  <strong className="text-white block mb-2 text-lg">Advisor's Recommendation</strong>
                  Based on these numbers, here is your clear action plan:
                  {kpiData.netCashFlow < 0 ? " You need to stop the leak. Check your recurring subscriptions and see what you can cancel today." :
                    kpiData.savingsRate < 20 ? " Set up an automatic transfer to your savings account on payday. If you don't see the money, you won't spend it." :
                      " Since your basics are covered, you should look into high-yield savings accounts or investments to make your money work harder for you."}
                  Consistency is key. Small, positive changes repeated every month will compound into significant wealth over time.
                </p>

                <div className="mt-8 p-4 bg-slate-900/50 border border-white/5 rounded-xl border-l-4 border-l-amber-500">
                  <h4 className="text-amber-500 font-bold uppercase tracking-wider text-xs mb-1">Advisor's Verdict</h4>
                  <p className="text-white italic">
                    &ldquo;You are on the {kpiData.savingsRate > 15 ? 'right path' : 'path to improvement'}.
                    Your wealth trajectory is currently: <strong>{kpiData.savingsRate > 15 ? 'CLIMBING' : 'FLAT'}</strong>. Keep pushing!&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
