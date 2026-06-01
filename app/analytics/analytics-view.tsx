'use client';

import { useEffect, useState } from 'react';
import { PageContent, PageShell } from '@/components/page-shell';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { Briefcase, Building2, MapPin } from 'lucide-react';

type JobStatsResponse = {
  totalJobs: number;
  locationCount: number;
  companyCount: number;
  mode?: 'database' | 'live';
  error?: string;
};

export default function AnalyticsView() {
  const [stats, setStats] = useState<JobStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/jobs/stats');
        const data = (await res.json()) as JobStatsResponse;
        if (!cancelled) {
          if (res.ok) setStats(data);
          else setLoadError(data.error ?? 'Could not load stats');
        }
      } catch {
        if (!cancelled) setLoadError('Could not load stats');
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statValue = (n: number | undefined) =>
    statsLoading ? '…' : (n ?? 0).toLocaleString();

  const sourceHint =
    stats?.mode === 'live'
      ? 'Counted from live API responses'
      : 'Counted from synced database';

  return (
    <PageShell>
      <PageHeader
        title="Job stats"
        subtitle="Counts from your synced database or the live API feed. Detailed salary and trend charts are not available yet."
      />

      <PageContent>
        {loadError && (
          <p className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total jobs"
            value={statValue(stats?.totalJobs)}
            hint={sourceHint}
            icon={Briefcase}
          />
          <StatCard
            label="Distinct locations"
            value={statValue(stats?.locationCount)}
            hint={sourceHint}
            icon={MapPin}
          />
          <StatCard
            label="Distinct companies"
            value={statValue(stats?.companyCount)}
            hint={sourceHint}
            icon={Building2}
          />
        </div>

        {!statsLoading && stats && stats.totalJobs === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No jobs in the index yet. An admin can sync sources from the Admin page, or browse the
            home page for live API results.
          </p>
        )}
      </PageContent>
    </PageShell>
  );
}
