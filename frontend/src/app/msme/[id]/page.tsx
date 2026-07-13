import { msmeApi } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import TrendBreakdown from '@/components/TrendBreakdown';
import RegimeShifts from '@/components/RegimeShifts';
import StressAccumulator from '@/components/StressAccumulator';
import HealthScoreCard from '@/components/HealthScoreCard';
import Recommendations from '@/components/Recommendations';
import DemoControls from '@/components/DemoControls';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MSMEDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const msmeId = parseInt(resolvedParams.id, 10);
  
  // Fetch everything in parallel
  let decompData, changepointData, stressData, scoreData;
  try {
    [decompData, changepointData, stressData, scoreData] = await Promise.all([
      msmeApi.getDecomposition(msmeId),
      msmeApi.getChangepoints(msmeId),
      msmeApi.getStress(msmeId),
      msmeApi.getScore(msmeId)
    ]);
  } catch (err) {
    return (
      <div className="p-12 text-center text-critical">
        Failed to load MSME data. Ensure backend is running and MSME exists.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-8 border-b border-border pb-4 flex flex-col gap-4">
        <div>
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft size={16} className="mr-1" /> Back to Portfolio
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">MSME Deep Dive</h1>
              <p className="text-muted-foreground">ID: {msmeId} • Continuous Monitoring Feed</p>
            </div>
            <div className="text-sm px-3 py-1 bg-muted rounded-md text-muted-foreground border border-border">
              Pipeline v2.0
            </div>
          </div>
        </div>
      </header>

      <DemoControls msmeId={msmeId} />

      <main className="grid grid-cols-12 gap-6">
        {/* Top Row: Hero Visual and Score */}
        <div className="col-span-12 lg:col-span-8 h-[450px]">
          <StressAccumulator data={stressData} />
        </div>
        <div className="col-span-12 lg:col-span-4 h-[450px]">
          <HealthScoreCard data={scoreData} />
        </div>

        {/* Middle Row: Trend and Regime */}
        <div className="col-span-12 lg:col-span-6 h-[400px]">
          <TrendBreakdown data={decompData} />
        </div>
        <div className="col-span-12 lg:col-span-6 h-[400px]">
          <RegimeShifts data={decompData} changepoints={changepointData} />
        </div>

        {/* Bottom Row: Actions */}
        <div className="col-span-12 lg:col-span-6 h-[300px]">
          <Recommendations data={scoreData} />
        </div>
      </main>
    </div>
  );
}
