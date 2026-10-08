import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
  trend?: number;
}

const TrendIndicator: React.FC<{ trend: number; title: string }> = ({ trend, title }) => {
  if (Number.isNaN(trend) || !Number.isFinite(trend)) return null;

  const isExpense = /expense|spend/i.test(title);
  const isFavorable = isExpense ? trend <= 0 : trend >= 0;

  return (
    <span className={'text-xs font-medium ' + (isFavorable ? 'text-emerald-700' : 'text-rose-700')}>
      {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
    </span>
  );
};

function useAnimatedNumber(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const currentValue = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      currentValue.current = target;
      setValue(target);
      return;
    }

    const start = currentValue.current;
    const difference = target - start;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = start + difference * easedProgress;
      currentValue.current = nextValue;
      setValue(nextValue);

      if (progress < 1) {
        frame.current = requestAnimationFrame(animate);
      } else {
        currentValue.current = target;
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass, trend }) => {
  const { formatCurrency } = useSettings();
  const animatedAmount = useAnimatedNumber(amount);

  return (
    <article className="summary-card rounded-xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-xs font-medium text-slate-500">{title}</h3>
        {trend !== undefined && <TrendIndicator trend={trend} title={title} />}
      </div>
      <p className={'mt-3 text-2xl font-semibold tracking-tight ' + colorClass}>
        {formatCurrency(animatedAmount)}
      </p>
    </article>
  );
};

export default SummaryCard;
