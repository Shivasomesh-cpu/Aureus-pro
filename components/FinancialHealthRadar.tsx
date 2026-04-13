import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface FinancialHealthRadarProps {
    data: {
        subject: string;
        A: number; // User Score
        B: number; // Healthy Baseline
        fullMark: number;
    }[];
}

const FinancialHealthRadar: React.FC<FinancialHealthRadarProps> = ({ data }) => {
    return (
        <div className="w-full relative" style={{ minHeight: 256 }}>
            <h4 className="text-sm font-semibold text-white mb-2 absolute top-0 left-0 z-10">Financial Health Profile</h4>
            <div className="absolute top-0 right-0 z-10 flex gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-gray-300">You</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                    <span className="text-gray-500">Baseline</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                        name="You"
                        dataKey="A"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="#10b981"
                        fillOpacity={0.4}
                    />
                    <Radar
                        name="Baseline"
                        dataKey="B"
                        stroke="#64748b"
                        strokeWidth={1}
                        fill="#64748b"
                        fillOpacity={0.1}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number) => [value, 'Score']}
                        labelStyle={{ color: '#94a3b8' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default FinancialHealthRadar;
