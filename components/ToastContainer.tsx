import React from 'react';
import { useToast, ToastType } from '../contexts/ToastContext';
import { XMarkIcon, SparklesIcon, ExclamationTriangleIcon, InfoIcon } from './icons';

const toastStyles: Record<ToastType, { border: string; bg: string; text: string; iconBg: string }> = {
  success: {
    border: 'border-emerald-500/30',
    bg: 'bg-slate-900/90',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  info: {
    border: 'border-primary-500/30',
    bg: 'bg-slate-900/90',
    text: 'text-primary-300',
    iconBg: 'bg-primary-500/20 text-primary-400',
  },
  warning: {
    border: 'border-amber-500/30',
    bg: 'bg-slate-900/90',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
  error: {
    border: 'border-rose-500/30',
    bg: 'bg-slate-900/90',
    text: 'text-rose-300',
    iconBg: 'bg-rose-500/20 text-rose-400',
  },
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl ${style.bg} border ${style.border} backdrop-blur-xl shadow-2xl shadow-black/50 animate-slide-up transition-all`}
            role="status"
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${style.iconBg}`}>
              {toast.type === 'success' && <SparklesIcon className="w-4 h-4" />}
              {toast.type === 'warning' && <ExclamationTriangleIcon className="w-4 h-4" />}
              {toast.type === 'error' && <ExclamationTriangleIcon className="w-4 h-4" />}
              {toast.type === 'info' && <InfoIcon className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className={`text-xs font-bold ${style.text}`}>{toast.title}</h4>
              {toast.message && (
                <p className="text-[11px] text-gray-300 mt-0.5 leading-relaxed break-words">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 -mr-1 -mt-1"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
