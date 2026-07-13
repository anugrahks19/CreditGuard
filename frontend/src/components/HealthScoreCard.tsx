"use client";

import { HealthScore } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface Props {
  data: HealthScore;
}

export default function HealthScoreCard({ data }: Props) {
  const getStatusColor = (score: number) => {
    if (score >= 70) return 'text-healthy';
    if (score >= 40) return 'text-watch';
    return 'text-critical';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 70) return <ShieldCheck className="text-healthy w-10 h-10" />;
    if (score >= 40) return <ShieldAlert className="text-watch w-10 h-10" />;
    return <ShieldX className="text-critical w-10 h-10" />;
  };

  // Format explanations for SHAP chart
  const shapData = data.explanations.map(exp => ({
    name: exp.feature_name,
    value: exp.shap_value,
    isNegative: exp.shap_value < 0
  })).sort((a, b) => a.value - b.value); // Sort by value for standard waterfall feel

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold mb-1">Health Score</h3>
          <p className="text-sm text-muted-foreground">Unified credit risk indicator</p>
        </div>
        {getStatusIcon(data.health_score)}
      </div>

      <div className="flex items-end gap-2 mb-8">
        <span className={`text-6xl font-black tracking-tighter ${getStatusColor(data.health_score)}`}>
          {data.health_score.toFixed(1)}
        </span>
        <span className="text-xl text-muted-foreground mb-1 font-medium">/ 100</span>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mb-6 border border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Est. 12-Month Probability of Default</span>
          <span className="text-lg font-bold text-foreground">
            {(data.pd_12m * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-semibold uppercase text-muted-foreground mb-4">Signal Breakdown (SHAP Attributions)</h4>
        <div className="w-full h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shapData} layout="vertical" margin={{ top: 0, right: 30, left: -20, bottom: 0 }}>
              <XAxis type="number" hide domain={['dataMin', 0]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={120}
                fontSize={11}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <RechartsTooltip 
                cursor={{ fill: 'var(--muted)' }}
                contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                formatter={(value: number) => [`${value.toFixed(1)} pts`, 'Impact']}
              />
              <ReferenceLine x={0} stroke="var(--border)" />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {shapData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isNegative ? 'var(--critical)' : 'var(--healthy)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
