"use client";

import { useState } from 'react';
import Link from 'next/link';
import { msmeApi } from '@/lib/api';
import { BrainCircuit, Database, ChevronLeft, CheckCircle2, TrendingUp, Target, Activity, FileWarning } from 'lucide-react';

export default function ModelValidationPage() {
  const [loading, setLoading] = useState<'bulk' | 'train' | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBulkGenerate = async () => {
    setLoading('bulk');
    setError(null);
    try {
      await msmeApi.generateBulkSynthetic(200); // 600 total (200 * 3 segments)
      alert("Successfully generated 600 synthetic MSMEs with ground truth labels!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleTrainAndValidate = async () => {
    setLoading('train');
    setError(null);
    try {
      const data = await msmeApi.trainAndValidateML();
      if (data.error) {
        setError(data.error);
      } else {
        setMetrics(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors">
              <ChevronLeft size={16} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight flex items-center gap-3">
            <BrainCircuit className="text-primary" /> Model Validation Layer
          </h1>
          <p className="text-muted-foreground">Statistical proof of accuracy and lead time against synthetic ground truth.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleBulkGenerate}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-all backdrop-blur-md disabled:opacity-50"
          >
            <Database size={16} />
            {loading === 'bulk' ? 'Generating 600 MSMEs...' : '1. Generate Bulk Data'}
          </button>
          
          <button 
            onClick={handleTrainAndValidate}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(13,148,136,0.3)] disabled:opacity-50"
          >
            <Target size={16} />
            {loading === 'train' ? 'Training & Validating...' : '2. Train & Validate Model'}
          </button>
        </div>
      </header>

      <main>
        {error && (
          <div className="bg-critical/20 border border-critical text-critical px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
            <FileWarning size={18} /> {error}
          </div>
        )}

        {!metrics && !error && (
          <div className="flex flex-col items-center justify-center p-24 text-center border border-dashed border-border rounded-2xl bg-muted/10">
            <BrainCircuit className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">No Model Trained Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Generate bulk synthetic data and then run the training pipeline to compute validation metrics.
            </p>
          </div>
        )}

        {metrics && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Headline Stat */}
            <div className="bg-card/50 backdrop-blur-xl border border-primary/30 rounded-2xl p-8 shadow-[0_0_30px_rgba(13,148,136,0.1)] relative overflow-hidden text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
              <h2 className="text-lg font-semibold text-primary mb-2 uppercase tracking-widest relative z-10">Headline Metric: Average Lead Time</h2>
              <div className="text-6xl font-extrabold text-foreground relative z-10 flex items-center justify-center gap-4">
                {metrics.average_lead_time_months.toFixed(1)} <span className="text-3xl text-muted-foreground">Months</span>
              </div>
              <p className="text-muted-foreground mt-4 max-w-xl mx-auto relative z-10">
                On average, the CreditGuard CUSUM pipeline breaches critical thresholds this many months before the actual simulated default occurs.
              </p>
            </div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col items-center text-center">
                <Target className="w-8 h-8 text-healthy mb-3" />
                <div className="text-3xl font-bold text-foreground">{(metrics.accuracy * 100).toFixed(1)}%</div>
                <div className="text-sm font-medium text-muted-foreground mt-1">Accuracy</div>
              </div>
              <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col items-center text-center">
                <TrendingUp className="w-8 h-8 text-primary mb-3" />
                <div className="text-3xl font-bold text-foreground">{(metrics.auc_roc * 100).toFixed(1)}%</div>
                <div className="text-sm font-medium text-muted-foreground mt-1">AUC-ROC</div>
              </div>
              <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-amber-500 mb-3" />
                <div className="text-3xl font-bold text-foreground">{(metrics.precision * 100).toFixed(1)}%</div>
                <div className="text-sm font-medium text-muted-foreground mt-1">Precision</div>
              </div>
              <div className="bg-card/40 backdrop-blur-md border border-border rounded-xl p-6 flex flex-col items-center text-center">
                <Activity className="w-8 h-8 text-blue-500 mb-3" />
                <div className="text-3xl font-bold text-foreground">{(metrics.recall * 100).toFixed(1)}%</div>
                <div className="text-sm font-medium text-muted-foreground mt-1">Recall</div>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="bg-card/40 backdrop-blur-md border border-border rounded-2xl p-8">
              <h3 className="text-lg font-semibold mb-6">Confusion Matrix (Test Set)</h3>
              <div className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 border border-border p-6 rounded-xl text-center">
                    <div className="text-xs text-muted-foreground mb-1">True Negative (Healthy)</div>
                    <div className="text-2xl font-bold text-healthy">{metrics.confusion_matrix[0][0]}</div>
                  </div>
                  <div className="bg-critical/10 border border-critical/30 p-6 rounded-xl text-center">
                    <div className="text-xs text-muted-foreground mb-1">False Positive</div>
                    <div className="text-2xl font-bold text-critical">{metrics.confusion_matrix[0][1]}</div>
                  </div>
                  <div className="bg-watch/10 border border-watch/30 p-6 rounded-xl text-center">
                    <div className="text-xs text-muted-foreground mb-1">False Negative</div>
                    <div className="text-2xl font-bold text-watch">{metrics.confusion_matrix[1][0]}</div>
                  </div>
                  <div className="bg-primary/10 border border-primary/30 p-6 rounded-xl text-center">
                    <div className="text-xs text-muted-foreground mb-1">True Positive (Defaulted)</div>
                    <div className="text-2xl font-bold text-primary">{metrics.confusion_matrix[1][1]}</div>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Evaluated on a 20% holdout set from a generated population of {metrics.sample_size} MSMEs.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
