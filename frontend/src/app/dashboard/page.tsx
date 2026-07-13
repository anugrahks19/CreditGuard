import { msmeApi } from '@/lib/api';
import Link from 'next/link';

export default async function PortfolioPage() {
  let msmes = [];
  try {
    msmes = await msmeApi.list();
    // Sort by negative velocity (largest drop first), then by absolute health score
    msmes.sort((a, b) => {
      // Missing scores go to bottom
      if (a.health_score === null && b.health_score === null) return 0;
      if (a.health_score === null) return 1;
      if (b.health_score === null) return -1;
      
      const deltaA = a.delta_score || 0;
      const deltaB = b.delta_score || 0;
      
      // We want most negative delta first (fastest dropping)
      if (Math.abs(deltaA - deltaB) > 0.1) {
        return deltaA - deltaB; 
      }
      
      // Secondary sort: lowest absolute health score
      return a.health_score - b.health_score;
    });
  } catch (error) {
    console.error("Failed to fetch MSMEs", error);
  }

  const getStatusPill = (score: number | null) => {
    if (score === null) return <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-medium">Pending</span>;
    if (score >= 70) return <span className="px-2 py-1 rounded bg-healthy/20 text-healthy text-xs font-bold border border-healthy/30">Healthy</span>;
    if (score >= 40) return <span className="px-2 py-1 rounded bg-watch/20 text-watch text-xs font-bold border border-watch/30">Watch</span>;
    return <span className="px-2 py-1 rounded bg-critical/20 text-critical text-xs font-bold border border-critical/30">Critical</span>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <header className="mb-10 flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">CreditGuard</h1>
          <p className="text-muted-foreground">MSME Early-Warning Credit Stress Detection</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm px-3 py-1 bg-muted rounded-md text-muted-foreground border border-border">
            Demo Environment
          </div>
        </div>
      </header>

      <main>
        <div className="bg-card rounded-2xl border border-border shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
            <h2 className="text-xl font-semibold">Portfolio Overview</h2>
            <div className="text-sm text-muted-foreground font-medium">
              {msmes.length} MSMEs Monitored
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {msmes.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">MSME Name</th>
                    <th className="px-6 py-4 font-semibold">Segment</th>
                    <th className="px-6 py-4 font-semibold">Onboarded</th>
                    <th className="px-6 py-4 font-semibold">Health Score</th>
                    <th className="px-6 py-4 font-semibold">PD (12m)</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {msmes.map((msme) => (
                    <tr key={msme.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{msme.name}</td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-muted-foreground">
                          {msme.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(msme.onboarded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {msme.health_score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{msme.health_score.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {msme.pd_12m !== null ? `${(msme.pd_12m * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusPill(msme.health_score)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/msme/${msme.id}`}
                          className="text-primary hover:text-primary-foreground font-medium transition-colors border border-primary/30 hover:bg-primary/20 px-4 py-2 rounded-md inline-block"
                        >
                          Analyze →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <p className="mb-4 text-lg">No MSME data found.</p>
                <p className="text-sm">Run the synthetic data generator via the backend to populate the portfolio.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
