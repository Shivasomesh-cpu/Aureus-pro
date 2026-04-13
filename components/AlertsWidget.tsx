import React, { useState, useRef, useEffect } from 'react';
import { Alert, AlertType, AlertPriority } from '../types';
import { BellIcon, CalendarIcon, TrendingDownIcon, ExclamationTriangleIcon, XMarkIcon, ClockIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface AlertsWidgetProps {
    alerts: Alert[];
    onDismiss: (alertId: string) => void;
    onSnooze: (alertId: string, days: number) => void;
}

const AlertsWidget: React.FC<AlertsWidgetProps> = ({ alerts, onDismiss, onSnooze }) => {
    const { currencySymbol } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const activeAlerts = alerts.filter(a => !a.dismissed && (!a.snoozedUntil || new Date(a.snoozedUntil) <= new Date()));

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
        if (isOpen) document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen]);

    if (activeAlerts.length === 0) return null;

    const getPriorityColor = (priority: AlertPriority) => {
        switch (priority) {
            case AlertPriority.HIGH: return 'border-rose-500/30 bg-rose-500/5';
            case AlertPriority.MEDIUM: return 'border-amber-500/30 bg-amber-500/5';
            case AlertPriority.LOW: return 'border-blue-500/30 bg-blue-500/5';
        }
    };

    const getPriorityBadgeColor = (priority: AlertPriority) => {
        switch (priority) {
            case AlertPriority.HIGH: return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case AlertPriority.MEDIUM: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case AlertPriority.LOW: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        }
    };

    const getAlertIcon = (type: AlertType) => {
        switch (type) {
            case AlertType.BILL_REMINDER:
            case AlertType.DEBT_PAYMENT_DUE:
                return <CalendarIcon className="w-4 h-4" />;
            case AlertType.SUBSCRIPTION_UNUSED:
                return <ExclamationTriangleIcon className="w-4 h-4" />;
            case AlertType.PRICE_DROP:
                return <TrendingDownIcon className="w-4 h-4" />;
            default:
                return <BellIcon className="w-4 h-4" />;
        }
    };

    const highCount = activeAlerts.filter(a => a.priority === AlertPriority.HIGH).length;

    return (
        <div className="relative" ref={panelRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 glass-premium rounded-xl hover:border-white/15 transition-all duration-200 group"
            >
                <div className="relative">
                    <BellIcon className="w-5 h-5 text-amber-400 group-hover:animate-pulse" />
                    {activeAlerts.length > 0 && (
                        <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${highCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}>
                            {activeAlerts.length}
                        </span>
                    )}
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors hidden sm:inline">
                    {activeAlerts.length} Alert{activeAlerts.length !== 1 ? 's' : ''}
                </span>
                <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Overlay Panel */}
            {isOpen && (
                <div className="absolute top-full mt-2 right-[-10px] w-[340px] sm:w-[400px] max-h-[480px] overflow-hidden glass-premium rounded-2xl border border-white/10 shadow-2xl shadow-black/50 z-50 animate-fade-in-up">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center">
                                <BellIcon className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Smart Alerts</h3>
                                <p className="text-[10px] text-gray-500">{activeAlerts.length} active</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Alert List */}
                    <div className="overflow-y-auto max-h-[400px] custom-scrollbar p-3 space-y-2">
                        {activeAlerts.map((alert, i) => (
                            <div
                                key={alert.id}
                                className={`border rounded-xl p-3 transition-all duration-200 cursor-pointer hover:bg-white/[0.03] ${getPriorityColor(alert.priority)} animate-fade-in-up`}
                                style={{ animationDelay: `${i * 30}ms` }}
                                onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${getPriorityBadgeColor(alert.priority)}`}>
                                            {getAlertIcon(alert.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                <h4 className="text-xs font-semibold text-white truncate">{alert.title}</h4>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border flex-shrink-0 ${getPriorityBadgeColor(alert.priority)}`}>
                                                    {alert.priority.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">{alert.message}</p>

                                            {alert.dueDate && (
                                                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}

                                            {/* Expanded actions */}
                                            {expandedAlert === alert.id && (
                                                <div className="mt-2.5 flex items-center gap-1.5 animate-fade-in-up">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSnooze(alert.id, 1); }}
                                                        className="px-2.5 py-1 text-[10px] font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                                                    >
                                                        Snooze 1d
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSnooze(alert.id, 7); }}
                                                        className="px-2.5 py-1 text-[10px] font-medium text-gray-300 bg-white/5 hover:bg-white/10 rounded-md transition-colors"
                                                    >
                                                        Snooze 7d
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                                                        className="px-2.5 py-1 text-[10px] font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors ml-auto"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDismiss(alert.id); }}
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-gray-500 hover:text-white flex-shrink-0"
                                        aria-label="Dismiss"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertsWidget;
