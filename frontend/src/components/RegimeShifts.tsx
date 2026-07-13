"use client";

import { Decomposition, Changepoint } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  data: Decomposition[];
  changepoints: Changepoint[];
}

export default function RegimeShifts({ data, changepoints }: Props) {
  const chartData = data.map(d => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
  }));

  // Create a map of formatted dates to changepoints for the reference lines
  const cpMap = new Map();
  changepoints.forEach(cp => {
    const formattedDate = new Date(cp.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    cpMap.set(formattedDate, cp);
  });

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Regime Shifts</h3>
        <p className="text-sm text-muted-foreground">BOCPD-detected shifts in revenue and cash flow variance</p>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
              formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
            />
            
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="var(--primary)" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'var(--primary)' }}
            />

            {Array.from(cpMap.keys()).map((dateKey, index) => {
              const cp = cpMap.get(dateKey);
              const isDrop = cp.description.toLowerCase().includes('drop');
              return (
                <ReferenceLine 
                  key={index} 
                  x={dateKey} 
                  stroke={isDrop ? 'var(--critical)' : 'var(--watch)'} 
                  strokeDasharray="4 4"
                  label={{ 
                    position: 'insideTopLeft', 
                    value: isDrop ? '▼ Shift' : 'Shift',
                    fill: isDrop ? 'var(--critical)' : 'var(--watch)',
                    fontSize: 11
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {changepoints.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Detected Shifts Log</h4>
          <ul className="space-y-2 max-h-32 overflow-y-auto pr-2">
            {changepoints.map((cp, idx) => {
              const isDrop = cp.description.toLowerCase().includes('drop');
              return (
                <li key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground w-24">
                    {new Date(cp.date).toLocaleDateString()}
                  </span>
                  <span className={`flex-1 ${isDrop ? 'text-critical' : 'text-foreground'}`}>
                    {cp.description}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-background border border-border">
                    {Math.round(cp.confidence * 100)}% conf
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
