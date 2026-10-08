import React, { useState, useRef } from 'react';
import { Transaction } from '../types';
import { parseBankStatement, ParsedStatementResult } from '../services/statementParser';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { XMarkIcon, SparklesIcon, DocumentArrowDownIcon, CheckIcon, CreditCardIcon } from './icons';

interface BankStatementUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (transactions: Transaction[]) => void | Promise<void>;
}

const BankStatementUploader: React.FC<BankStatementUploaderProps> = ({
  isOpen,
  onClose,
  onImportTransactions,
}) => {
  const { formatCurrency } = useSettings();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedStatementResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseBankStatement(text);
        setParsedResult(result);
        showToast({
          type: 'success',
          title: 'Statement Parsed',
          message: `Identified ${result.transactions.length} transactions from ${result.detectedBank}.`,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to parse bank statement file.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleProcessPastedText = () => {
    if (!pasteContent.trim()) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = parseBankStatement(pasteContent);
      setParsedResult(result);
      showToast({
        type: 'success',
        title: 'Statement Parsed',
        message: `Identified ${result.transactions.length} transactions from ${result.detectedBank}.`,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to parse pasted statement text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedResult) return;
    await onImportTransactions(parsedResult.transactions);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/60 flex-shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center">
              <DocumentArrowDownIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">Bank Statement Ingestion</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                  AI Auto-Clean
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingest CSV or raw text statements from Chase, BofA, Wells Fargo, Barclays, HDFC, Revolut & more
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
          {!parsedResult ? (
            <div className="space-y-5">
              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'upload'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📁 Upload CSV File
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'paste'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  📋 Paste Statement Text
                </button>
              </div>

              {activeTab === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-3xl p-10 text-center cursor-pointer bg-slate-50/50 hover:bg-amber-50/30 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs group-hover:scale-105 transition-transform">
                    <DocumentArrowDownIcon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Click to browse or drop your bank statement
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports exported transaction files from any major banking institution (.CSV, .TXT)
                  </p>
                  <span className="inline-block mt-3 text-[11px] font-semibold text-amber-700 bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200">
                    Parsed locally in your browser
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={8}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                    placeholder="Paste CSV rows or statement copy here:&#10;Date, Description, Amount&#10;2024-03-01, Direct Deposit Payroll, 3850.00&#10;2024-03-02, POS DEBIT STARBUCKS #194, 6.45..."
                    className="w-full p-4 rounded-2xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 bg-slate-50/40"
                  />
                  <button
                    onClick={handleProcessPastedText}
                    disabled={isProcessing || !pasteContent.trim()}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isProcessing ? 'Analyzing Financial Data...' : 'Parse & Extract Transactions'}
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
                  ⚠️ {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Statement KPI Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Institution</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{parsedResult.detectedBank}</p>
                  <span className="text-[10px] text-slate-500">{parsedResult.transactions.length} records found</span>
                </div>
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80">
                  <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Total Credits</p>
                  <p className="text-base font-bold text-emerald-800 mt-0.5">+{formatCurrency(parsedResult.totalIncome)}</p>
                  <span className="text-[10px] text-emerald-600">Income & transfers</span>
                </div>
                <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80">
                  <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Total Debits</p>
                  <p className="text-base font-bold text-rose-800 mt-0.5">-{formatCurrency(parsedResult.totalExpenses)}</p>
                  <span className="text-[10px] text-rose-600">Living expenses</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Cash Flow</p>
                  <p className={`text-base font-bold mt-0.5 ${parsedResult.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {parsedResult.netCashFlow >= 0 ? '+' : ''}{formatCurrency(parsedResult.netCashFlow)}
                  </p>
                  <span className="text-[10px] text-slate-500">Period net balance</span>
                </div>
              </div>

              {/* Detected Subscriptions Notification */}
              {parsedResult.potentialSubscriptions.length > 0 && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <SparklesIcon className="w-5 h-5 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        {parsedResult.potentialSubscriptions.length} Recurring Subscriptions Detected
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        {parsedResult.potentialSubscriptions.map(s => s.description).slice(0, 4).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-100/70 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Statement Transactions Preview</span>
                  <button
                    onClick={() => setParsedResult(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Re-upload
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 pl-4">Date</th>
                        <th className="p-2.5">Merchant / Narrative</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 pr-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedResult.transactions.slice(0, 30).map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50/80">
                          <td className="p-2.5 pl-4 text-slate-500 font-mono text-[11px]">{t.date}</td>
                          <td className="p-2.5 font-semibold text-slate-900">{t.description}</td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {t.category}
                            </span>
                          </td>
                          <td className={`p-2.5 pr-4 text-right font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setParsedResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all flex items-center gap-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Import {parsedResult.transactions.length} Transactions into Aureus</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankStatementUploader;
