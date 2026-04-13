import React, { useMemo } from 'react';
import { Transaction, BehavioralProfile } from '../types';
import { calculateWealthMomentum, WealthMomentumData } from '../services/wealthMomentumService';

interface WealthMomentumWidgetProps {
    transactions: Transaction[];
    behavioralProfile: BehavioralProfile | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getHeatmapColor(intensity: number): string {
    if (intensity === 0) return 'rgba(255,255,255,0.03)';
    if (intensity < 0.2) return 'rgba(16, 185, 129, 0.25)';
    if (intensity < 0.4) return 'rgba(16, 185, 129, 0.5)';
    if (intensity < 0.6) return 'rgba(245, 158, 11, 0.4)';
    if (intensity < 0.8) return 'rgba(245, 158, 11, 0.7)';
    return 'rgba(239, 68, 68, 0.7)';
}

const WealthMomentumWidget: React.FC<WealthMomentumWidgetProps> = ({
    transactions, behavioralProfile
}) => {
    const data: WealthMomentumData = useMemo(
        () => calculateWealthMomentum(transactions, behavioralProfile),
        [transactions, behavioralProfile]
    );

    const creepColor = data.lifestyleCreepIndex > 5 ? 'text-rose-400' :
        data.lifestyleCreepIndex < -5 ? 'text-emerald-400' : 'text-gray-400';

    const trendIcon = data.burnRateTrend === 'improving' ? '↓' :
        data.burnRateTrend === 'worsening' ? '↑' : '→';
    const trendColor = data.burnRateTrend === 'improving' ? 'text-emerald-400' :
        data.burnRateTrend === 'worsening' ? 'text-rose-400' : 'text-gray-500';

    return (
        <div className="glass-premium rounded-2xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center">
                        <span className="text-lg">🔥</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white">Wealth Momentum</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">Burn Rate & Lifestyle Tracking</p>
                    </div>
                </div>
                {/* Financial Persona Badge */}
                <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                    style={{
                        background: `${data.persona.color}10`,
                        borderColor: `${data.persona.color}30`,
                    }}
                >
                    <span className="text-lg">{data.persona.icon}</span>
                    <div>
                        <div className="text-[10px] font-bold" style={{ color: data.persona.color }}>{data.persona.name}</div>
                        <div className="text-[8px] text-gray-500">Financial Persona</div>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="mb-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-3">12-Week Spending Heatmap</p>
                <div className="flex gap-1">
                    {/* Day labels */}
                    <div className="flex flex-col gap-[3px] mr-1 pt-0">
                        {DAY_LABELS.map(day => (
                            <div key={day} className="h-[18px] flex items-center">
                                <span className="text-[8px] text-gray-600 w-6 text-right">{day}</span>
                            </div>
                        ))}
                    </div>
                    {/* Grid */}
                    <div className="flex gap-[3px] flex-1">
                        {Array.from({ length: 12 }, (_, weekIdx) => (
                            <div key={weekIdx} className="flex flex-col gap-[3px] flex-1">
                                {Array.from({ length: 7 }, (_, dayIdx) => {
                                    const cell = data.heatmapGrid.find(
                                        c => c.week === weekIdx && c.dayOfWeek === dayIdx
                                    );
                                    return (
                                        <div
                                            key={dayIdx}
                                            className="h-[18px] rounded-[3px] transition-all duration-200 hover:scale-125 hover:z-10 relative group cursor-pointer"
                                            style={{ background: getHeatmapColor(cell?.intensity || 0) }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-gray-900 border border-white/10 text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl">
                                                <div className="font-medium">{cell?.dateLabel || ''}</div>
                                                <div className="text-gray-400">
                                                    {cell?.amount ? cell.amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Legend */}
                <div className="flex items-center justify-end gap-1 mt-2">
                    <span className="text-[8px] text-gray-600">Less</span>
                    {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((v, i) => (
                        <div key={i} className="w-3 h-3 rounded-[2px]" style={{ background: getHeatmapColor(v) }} />
                    ))}
                    <span className="text-[8px] text-gray-600">More</span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
                {/* Lifestyle Creep */}
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Lifestyle Creep</span>
                    <div className={`text-xl font-black tabular-nums ${creepColor}`}>
                        {data.lifestyleCreepIndex > 0 ? '+' : ''}{data.lifestyleCreepIndex}%
                    </div>
                    <span className="text-[8px] text-gray-600">
                        {data.lifestyleCreepIndex > 5 ? 'Spending outpacing income' :
                            data.lifestyleCreepIndex < -5 ? 'Spending decreasing' : 'Stable'}
                    </span>
                </div>

                {/* Savings Speed */}
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Savings Speed</span>
                    <div className="text-xl font-black tabular-nums text-white">
                        {data.savingsSpeedScore}
                    </div>
                    <div className="mt-1 h-1.5 bg-white/5 rounded-full overflow-hidden mx-2">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${data.savingsSpeedScore}%`,
                                background: data.savingsSpeedScore >= 60 ? '#10b981' :
                                    data.savingsSpeedScore >= 30 ? '#f59e0b' : '#ef4444'
                            }}
                        />
                    </div>
                    <span className="text-[8px] text-gray-600 mt-1 block">/100</span>
                </div>

                {/* Burn Rate */}
                <div className="glass-card rounded-xl p-3 text-center">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider block mb-1">Avg Burn Rate</span>
                    <div className="text-xl font-black tabular-nums text-white">
                        {data.averageBurnRate.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <span className={`text-[8px] font-semibold ${trendColor}`}>
                        {trendIcon} {data.burnRateTrend} /week
                    </span>
                </div>
            </div>

            {/* Persona Description */}
            <div className="mt-4 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    <span className="text-lg mr-1">{data.persona.icon}</span>
                    <span className="font-bold" style={{ color: data.persona.color }}>{data.persona.name}</span>
                    {' — '}{data.persona.description}
                </p>
            </div>
        </div>
    );
};

export default WealthMomentumWidget;
