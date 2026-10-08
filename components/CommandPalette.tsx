import React, { useState, useEffect } from 'react';
import { SearchIcon, CommandIcon, XMarkIcon, SparklesIcon, ChartBarIcon, ChartPieIcon, CreditCardIcon, PlusIcon } from './icons';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigation' | 'Actions' | 'AI Suite';
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: 'dashboard' | 'reports' | 'ai' | 'plan') => void;
  onOpenNewTransaction: () => void;
  onOpenBudgets: () => void;
  onOpenDebts: () => void;
  onSelectAITab?: (tab: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onChangeView,
  onOpenNewTransaction,
  onOpenBudgets,
  onOpenDebts,
  onSelectAITab,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const commands: CommandItem[] = [
    {
      id: 'dash',
      title: 'Go to Financial Dashboard',
      category: 'Navigation',
      shortcut: 'G D',
      icon: <ChartBarIcon className="w-4 h-4 text-amber-400" />,
      action: () => { onChangeView('dashboard'); onClose(); },
    },
    {
      id: 'plan',
      title: 'Open my financial plan',
      category: 'Navigation',
      shortcut: 'G P',
      icon: <ChartPieIcon className="w-4 h-4 text-indigo-400" />,
      action: () => { onChangeView('plan'); onClose(); },
    },
    {
      id: 'ai-suite',
      title: 'Aureus Intelligence Suite',
      category: 'Navigation',
      shortcut: 'G I',
      icon: <SparklesIcon className="w-4 h-4 text-violet-400" />,
      action: () => { onChangeView('ai'); onClose(); },
    },
    {
      id: 'council',
      title: 'The Aureus Advisory Council (3-Agent AI)',
      category: 'AI Suite',
      icon: <SparklesIcon className="w-4 h-4 text-amber-400" />,
      action: () => {
        onChangeView('ai');
        if (onSelectAITab) onSelectAITab('council');
        onClose();
      },
    },
    {
      id: 'alchemist',
      title: 'Aureus Alchemist (What-If Budget Simulator)',
      category: 'AI Suite',
      icon: <SparklesIcon className="w-4 h-4 text-emerald-400" />,
      action: () => {
        onChangeView('ai');
        if (onSelectAITab) onSelectAITab('alchemist');
        onClose();
      },
    },
    {
      id: 'life-architect',
      title: 'The Life Architect (10-Year Monte Carlo)',
      category: 'AI Suite',
      icon: <SparklesIcon className="w-4 h-4 text-indigo-400" />,
      action: () => {
        onChangeView('ai');
        if (onSelectAITab) onSelectAITab('architect');
        onClose();
      },
    },
    {
      id: 'reports',
      title: 'Analytics & Monthly Reports',
      category: 'Navigation',
      shortcut: 'G R',
      icon: <ChartPieIcon className="w-4 h-4 text-emerald-400" />,
      action: () => { onChangeView('reports'); onClose(); },
    },
    {
      id: 'new-tx',
      title: 'Add New Transaction',
      category: 'Actions',
      shortcut: 'N T',
      icon: <PlusIcon className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenNewTransaction(); onClose(); },
    },
    {
      id: 'manage-debts',
      title: 'Manage Debts & Payoff Trajectory',
      category: 'Actions',
      icon: <CreditCardIcon className="w-4 h-4 text-rose-400" />,
      action: () => { onOpenDebts(); onClose(); },
    },
    {
      id: 'manage-budgets',
      title: 'Manage Monthly Budgets',
      category: 'Actions',
      icon: <ChartPieIcon className="w-4 h-4 text-amber-400" />,
      action: () => { onOpenBudgets(); onClose(); },
    },
  ];

  const filteredCommands = commands.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 sm:pt-28 p-4">
      <div
        className="bg-slate-900 border border-white/10 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-slate-950/60">
          <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, AI tools, views, or actions..."
            className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-white/5 border border-white/10 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-colors ${
                  idx === selectedIndex
                    ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
                    : 'text-gray-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    {cmd.icon}
                  </div>
                  <div>
                    <p className="font-semibold">{cmd.title}</p>
                    <span className="text-[10px] text-gray-500">{cmd.category}</span>
                  </div>
                </div>

                {cmd.shortcut && (
                  <kbd className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/5 bg-slate-950/40 flex items-center justify-between text-[11px] text-gray-500">
          <span>Navigate with <kbd className="text-gray-400">↑</kbd> <kbd className="text-gray-400">↓</kbd></span>
          <span>Select with <kbd className="text-gray-400">↵ Enter</kbd></span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
