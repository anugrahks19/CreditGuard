"use client";

import { Decomposition } from '@/lib/api';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface Props {
  data: Decomposition[];
}

export default function TrendBreakdown({ data }: Props) {
  const chartData = data.map(d => ({
    ...d,
    formattedDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    // Negative residuals are interesting to highlight
    slump: d.revenue_residual < 0 ? Math.abs(d.revenue_residual) : 0
  }));

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-1">Trend & Residual Breakdown</h3>
        <p className="text-sm text-muted-foreground">STL Decomposition showing true underlying trend vs seasonality</p>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSlump" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--watch)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--watch)" stopOpacity={0}/>
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
              yAxisId="left"
              stroke="var(--muted-foreground)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="var(--watch)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              hide
            />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                if (name === 'Negative Residual (Slump)') return [`$${value.toLocaleString()}`, name];
                return [`$${value.toLocaleString()}`, name];
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            
            {/* Raw revenue area */}
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue" 
              name="Raw Revenue"
              stroke="var(--muted)" 
              fillOpacity={0.1} 
              fill="var(--muted)" 
            />
            
            {/* Smooth Trend line */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="revenue_trend" 
              name="Underlying Trend"
              stroke="var(--primary)" 
              strokeWidth={3}
              dot={false}
            />

            {/* Negative Residual Area highlighting slumps */}
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="slump"
              name="Negative Residual (Slump)"
              stroke="none"
              fill="url(#colorSlump)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
