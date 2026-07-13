"use client";

import { useState } from 'react';
import { msmeApi } from '@/lib/api';
import { Zap, FileWarning, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  msmeId: number;
}

export default function DemoControls({ msmeId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleGSTShock = async () => {
    setLoading('gst');
    try {
      await msmeApi.simulateGSTMissed(msmeId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  const handleAAShock = async () => {
    setLoading('aa');
    try {
      await msmeApi.simulateAAShock(msmeId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h4 className="font-bold text-base mb-1 flex items-center gap-2 text-foreground">
            <Zap size={16} className="text-primary animate-pulse" />
            Hackathon Demo Controls
          </h4>
          <p className="text-sm text-muted-foreground">Simulate real-time ecosystem webhooks</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={handleGSTShock}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            {loading === 'gst' ? <RefreshCcw size={16} className="animate-spin" /> : <FileWarning size={16} className="text-watch" />}
            Simulate Missed GST
          </button>
          
          <button 
            onClick={handleAAShock}
            disabled={loading !== null}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            {loading === 'aa' ? <RefreshCcw size={16} className="animate-spin" /> : <Zap size={16} className="text-critical" />}
            Simulate AA Revenue Shock
          </button>
        </div>
      </div>
    </div>
  );
}
