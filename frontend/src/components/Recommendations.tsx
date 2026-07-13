"use client";

import { HealthScore } from '@/lib/api';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface Props {
  data: HealthScore;
}

export default function Recommendations({ data }: Props) {
  const getRecommendations = (score: number) => {
    if (score >= 70) {
      return [
        "Maintain current credit lines and monitoring cadence.",
        "Consider offering expansion capital based on strong cash flow stability.",
        "No immediate action required."
      ];
    }
    
    if (score >= 40) {
      return [
        "Schedule a check-in call with the business owner to discuss recent revenue dips.",
        "Request updated inventory and accounts receivable aging reports.",
        "Place on enhanced monthly monitoring (Watchlist)."
      ];
    }

    return [
      "IMMEDIATE ACTION: Initiate credit restructuring dialogue.",
      "Freeze any unused revolving credit facilities to limit exposure.",
      "Dispatch field team for physical inventory/operations verification.",
      "Prepare stress scenario analysis for credit committee."
    ];
  };

  const score = data.health_score;
  const recs = getRecommendations(score);

  return (
    <div className="bg-card border border-border p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-xl font-bold mb-1">Recommended Actions</h3>
        <p className="text-sm text-muted-foreground">System-generated next steps for Relationship Manager</p>
      </div>

      <div className="flex-1 mt-2">
        <ul className="space-y-4">
          {recs.map((rec, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <div className="mt-0.5">
                {score >= 70 ? (
                  <CheckCircle className="text-healthy w-5 h-5" />
                ) : score >= 40 ? (
                  <AlertCircle className="text-watch w-5 h-5" />
                ) : (
                  <XCircle className="text-critical w-5 h-5" />
                )}
              </div>
              <p className="text-sm leading-relaxed text-foreground font-medium">{rec}</p>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-6 pt-4 border-t border-border">
        <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition-colors">
          Export Report to PDF
        </button>
      </div>
    </div>
  );
}
