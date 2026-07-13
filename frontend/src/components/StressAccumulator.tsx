"use client";

import { StressScore } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';

interface Props {
  data: StressScore[];
}

export default function StressAccumulator({ data }: Props) {
  // Format data for chart
  const chartData = data.map(d => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  }));

  const thresholdCrossedIdx = chartData.findIndex(d => d.is_stressed);
  const thresholdCrossedDate = thresholdCrossedIdx >= 0 ? chartData[thresholdCrossedIdx].formattedDate : null;

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">CUSUM Stress Accumulator</h3>
          <p className="text-sm text-muted-foreground">Cumulative sum of standardized negative deviations</p>
        </div>
        {thresholdCrossedDate && (
          <div className="flex items-center gap-2 bg-critical/20 text-critical px-3 py-1.5 rounded-lg border border-critical/30">
            <AlertTriangle size={16} />
            <span className="text-sm font-bold">Stress Threshold Breached: {thresholdCrossedDate}</span>
          </div>
        )}
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--critical)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--critical)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis 
              dataKey="formattedDate" 
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
            />
            <ReferenceLine y={2.0} label={{ position: 'top', value: 'Critical Threshold', fill: 'var(--critical)', fontSize: 12 }} stroke="var(--critical)" strokeDasharray="3 3" />
            
            <Area 
              type="monotone" 
              dataKey="stress_value" 
              name="Stress Level"
              stroke="var(--critical)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorStress)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
