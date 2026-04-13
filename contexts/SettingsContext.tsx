import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

interface SettingsContextType {
    currency: Currency;
    setCurrency: (c: Currency) => void;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string | Date) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        return (localStorage.getItem('expenseTrackerCurrency') as Currency) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('expenseTrackerCurrency', currency);
    }, [currency]);

    const setCurrency = (c: Currency) => setCurrencyState(c);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string | Date) => {
        if (!date) return '';
        const d = new Date(date);
        // Format: dd/mm/yy
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
    };

    return (
        <SettingsContext.Provider value={{ currency, setCurrency, formatCurrency, formatDate }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
