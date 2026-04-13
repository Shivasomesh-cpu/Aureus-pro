import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { parseTransactionFromText } from '../services/geminiService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { MicrophoneIcon } from './icons';
import CategoryPill from './CategoryPill';
import { useSettings } from '../contexts/SettingsContext';

interface SmartInputProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
}

const SmartInput: React.FC<SmartInputProps> = ({ onSave }) => {
  const { formatCurrency, currency } = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedTransaction, setParsedTransaction] = useState<Partial<Transaction> | null>(null);

  const { isListening, transcript, startListening, stopListening, hasRecognitionSupport } = useVoiceRecognition();

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setError(null);
    setParsedTransaction(null);

    try {
      const parsed = await parseTransactionFromText(inputValue);
      if (parsed) {
        setParsedTransaction(parsed);
      } else {
        setError("Sorry, I couldn't understand that. Please try rephrasing.");
      }
    } catch (err) {
      setError("An error occurred while parsing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (parsedTransaction) {
      onSave(parsedTransaction as Omit<Transaction, 'id'>);
      resetState();
    }
  };

  const resetState = () => {
    setInputValue('');
    setParsedTransaction(null);
    setError(null);
    setIsLoading(false);
  }

  const getPlaceholder = () => {
    if (currency === 'INR') return "e.g., 'Coffee with Jane for 200 yesterday'";
    if (currency === 'JPY') return "e.g., 'Lunch for 1000 today'";
    return "e.g., 'Coffee with Jane for 5.50 yesterday'";
  }

  return (
    <div className="glass-premium p-5 md:p-6 rounded-2xl mb-8 transition-all duration-300 hover:border-white/10">
      {parsedTransaction ? (
        <div className="animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-semibold text-white">Confirm Transaction</h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${parsedTransaction.aiGenerated ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
              {parsedTransaction.aiGenerated ? '✨ Gemini AI' : '⚡ Local Engine'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <span className="text-gray-500 text-xs block mb-1 uppercase tracking-wider">Description</span>
              <span className="font-medium text-white">{parsedTransaction.description}</span>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <span className="text-gray-500 text-xs block mb-1 uppercase tracking-wider">Amount</span>
              <span className={`font-bold text-lg ${parsedTransaction.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(parsedTransaction.amount || 0)}
              </span>
            </div>
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <span className="text-gray-500 text-xs uppercase tracking-wider">Category</span>
              <CategoryPill category={parsedTransaction.category || 'Other'} />
            </div>
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
              <span className="text-gray-500 text-xs block mb-1 uppercase tracking-wider">Date</span>
              <span className="font-medium text-white">{new Date(parsedTransaction.date || '').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button onClick={resetState} className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200">
              Cancel
            </button>
            <button onClick={handleConfirm} className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-600/20 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              ✓ Confirm
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          <label htmlFor="smart-input" className="block text-sm font-semibold text-gradient mb-3 tracking-wide">
            Add transaction with natural language
          </label>
          <div className="relative group">
            {/* Animated focus ring */}
            <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-amber-500/0 via-primary-500/0 to-emerald-500/0 group-focus-within:from-amber-500/20 group-focus-within:via-primary-500/30 group-focus-within:to-emerald-500/20 transition-all duration-500 blur-sm"></div>

            <input
              id="smart-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="relative w-full pl-5 pr-14 py-3.5 bg-white/5 border border-white/8 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:bg-white/[0.07] focus:border-amber-500/30 input-glow transition-all duration-300 text-sm"
              placeholder={getPlaceholder()}
              disabled={isLoading || isListening}
            />
            {hasRecognitionSupport && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute inset-y-0 right-2 flex items-center p-2 my-1.5 rounded-lg transition-all duration-300 ${isListening
                    ? 'text-rose-400 bg-rose-400/10 animate-pulse-glow'
                    : 'text-gray-500 hover:text-amber-400 hover:bg-white/5'
                  }`}
                aria-label="Use voice input"
                disabled={isLoading}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {isLoading && (
            <div className="absolute -bottom-7 left-0 flex items-center gap-1.5 text-xs text-amber-400/80">
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
                <div className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              </div>
              Processing...
            </div>
          )}
          {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
        </form>
      )}
    </div>
  );
};

export default SmartInput;
