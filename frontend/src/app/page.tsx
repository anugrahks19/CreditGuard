import Link from 'next/link';
import { ShieldCheck, TrendingDown, BrainCircuit, Activity } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-watch/10 blur-[80px] pointer-events-none"></div>
      
      <header className="px-8 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary w-8 h-8" />
          <h1 className="text-2xl font-bold tracking-tight">CreditGuard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium transition-all backdrop-blur-md">
            Enter Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-6 relative z-10">
        <div className="max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            IDBI Innovate 2026 • Track 04
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
            Detect MSME Stress <br />
            <span className="text-primary bg-none">12 Months</span> Before Default
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A continuous financial-health monitoring system that replaces static credit scores. Powered by an explainable deterministic core and a statistically validated ML layer.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link 
              href="/dashboard"
              className="px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(13,148,136,0.4)] flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              Launch Portfolio Dashboard
            </Link>
            
            <Link 
              href="/model-validation"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold text-lg transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <BrainCircuit className="w-5 h-5" />
              View ML Validation
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl w-full">
          <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl hover:bg-card/80 transition-colors">
            <TrendingDown className="w-8 h-8 text-watch mb-4" />
            <h3 className="text-lg font-semibold mb-2">Early Warning</h3>
            <p className="text-muted-foreground text-sm">Identifies regime shifts and cash flow slumps long before missed EMI payments occur.</p>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl hover:bg-card/80 transition-colors">
            <ShieldCheck className="w-8 h-8 text-healthy mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fully Explainable</h3>
            <p className="text-muted-foreground text-sm">Deterministic CUSUM pipeline with SHAP attribution—perfect for regulatory compliance.</p>
          </div>
          <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl hover:bg-card/80 transition-colors">
            <BrainCircuit className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">ML Validated</h3>
            <p className="text-muted-foreground text-sm">Statistically proven to hit 90%+ accuracy against continuous ecosystem telemetry.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
