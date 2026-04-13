import React, { useEffect, useRef, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface SummaryCardProps {
  title: string;
  amount: number;
  colorClass: string;
  trend?: number;
}

const TrendIndicator: React.FC<{ trend: number }> = ({ trend }) => {
  const isPositive = trend >= 0;
  const color = isPositive
    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  const symbol = isPositive ? '▲' : '▼';

  if (isNaN(trend) || !isFinite(trend)) return null;

  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 ${color}`}>
      {symbol} {Math.abs(trend).toFixed(1)}%
    </span>
  );
};

// Animated counter effect
function useAnimatedNumber(target: number, duration: number = 600) {
  const [value, setValue] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else prevRef.current = target;
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, colorClass, trend }) => {
  const { formatCurrency } = useSettings();
  const animatedAmount = useAnimatedNumber(amount);
  const formattedAmount = formatCurrency(animatedAmount);

  const isPositive = amount >= 0;
  const gradientFrom = isPositive ? 'from-emerald-500' : 'from-rose-500';
  const gradientTo = isPositive ? 'to-teal-500' : 'to-orange-500';
  const glowColor = isPositive ? 'bg-emerald-500' : 'bg-rose-500';

  return (
    <div className="relative group animate-fade-in-up card-glow">
      {/* Outer glow */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientFrom}/20 ${gradientTo}/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-all duration-700`}></div>

      <div className="relative glass-premium p-5 md:p-6 rounded-2xl overflow-hidden transition-all duration-500 group-hover:border-white/15">
        {/* Corner accent */}
        <div className={`absolute top-0 right-0 w-28 h-28 -mr-6 -mt-6 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-700 ${glowColor}`}></div>

        {/* Decorative dot pattern */}
        <div className="absolute bottom-3 right-3 grid grid-cols-3 gap-1 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{title}</h3>
            {trend !== undefined && <TrendIndicator trend={trend} />}
          </div>

          <div className="flex items-baseline gap-1">
            <p className={`text-2xl md:text-3xl font-bold tracking-tight ${colorClass} transition-transform duration-500 origin-left group-hover:scale-[1.03]`}>
              {formattedAmount}
            </p>
          </div>

          {/* Progress bar accent */}
          <div className="mt-4 w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${gradientFrom} ${gradientTo} transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min(Math.abs(amount) / 100, 100)}%`, opacity: 0.4 }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;