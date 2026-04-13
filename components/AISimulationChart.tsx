import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSettings } from '../contexts/SettingsContext';

interface AISimulationChartProps {
    data: any[];
}

const AISimulationChart: React.FC<AISimulationChartProps> = ({ data }) => {
    const { formatCurrency } = useSettings();

    return (
        <div className="relative flex flex-col" style={{ minHeight: 260 }}>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex-shrink-0">Future Wealth Forecast (6 Months)</h4>
            <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">

                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorOptimistic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLikely" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorConservative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => formatCurrency(value)}
                            width={60}
                        />
                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="glass-card p-3 rounded-xl border border-white/10 shadow-xl">
                                            <p className="text-xs text-slate-400 mb-2">Month {label}</p>
                                            {payload.map((entry: any, index: number) => {
                                                let name = "Scenario";
                                                let color = entry.color;
                                                if (entry.dataKey === "p90") { name = "Optimistic"; color = "#34d399"; }
                                                if (entry.dataKey === "p50") { name = "Likely"; color = "#60a5fa"; }
                                                if (entry.dataKey === "p10") { name = "Conservative"; color = "#fb7185"; }

                                                return (
                                                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
                                                        <span className="text-xs text-gray-300 w-20">{name}</span>
                                                        <span className="text-xs font-bold text-white font-mono">{formatCurrency(entry.value)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area type="monotone" dataKey="p90" stroke="#10b981" strokeWidth={1} fillOpacity={1} fill="url(#colorOptimistic)" />
                        <Area type="monotone" dataKey="p50" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLikely)" />
                        <Area type="monotone" dataKey="p10" stroke="#f43f5e" strokeWidth={1} fillOpacity={1} fill="url(#colorConservative)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AISimulationChart;
