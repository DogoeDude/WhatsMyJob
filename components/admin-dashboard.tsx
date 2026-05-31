'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { PageContent, PageShell } from '@/components/page-shell';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { SectionCard } from '@/components/section-card';
import { Button } from '@/components/ui/button';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
  Loader2,
} from 'lucide-react';

type JobSourceRow = {
  id: string;
  name: string;
  kind: string;
  enabled: boolean;
  lastSyncAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  jobCount: number;
};

type SyncLogRow = {
  id: string;
  sourceId: string;
  status: string;
  jobsAdded: number;
  jobsUpdated: number;
  error: string | null;
  createdAt: string;
  source: { name: string };
};

type SourcesResponse = {
  sources: JobSourceRow[];
  logs: SyncLogRow[];
  configured: { id: string; name: string; configured: boolean }[];
  stats: { totalJobs: number; locationCount: number; companyCount: number };
};

function formatWhen(iso: string | null) {
  if (!iso) return 'Never';
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function sourceStatus(
  source: JobSourceRow,
  syncingId: string | null
): 'active' | 'syncing' | 'error' | 'idle' {
  if (syncingId === source.id) return 'syncing';
  if (source.lastStatus === 'error') return 'error';
  if (source.lastStatus === 'success') return 'active';
  return 'idle';
}

export function AdminDashboard() {
  const [data, setData] = useState<SourcesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/jobs/sources');
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch {
      setMessage('Could not load job sources.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runSync = async (sourceId?: string) => {
    setMessage(null);
    if (sourceId) setSyncingId(sourceId);
    else setSyncingAll(true);

    try {
      const res = await fetch('/api/jobs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error ?? 'Sync failed');
        return;
      }
      const parts = Object.entries(json.results ?? {}).map(([id, r]) => {
        const row = r as { added?: number; updated?: number; error?: string };
        if (row.error) return `${id}: ${row.error}`;
        return `${id}: +${row.added ?? 0} new, ${row.updated ?? 0} updated`;
      });
      setMessage(parts.join(' · ') || 'Sync complete');
      await load();
    } catch {
      setMessage('Sync request failed');
    } finally {
      setSyncingAll(false);
      setSyncingId(null);
    }
  };

  const configuredMap = new Map(data?.configured.map((c) => [c.id, c.configured]) ?? []);

  const activeSources =
    data?.sources.filter((s) => configuredMap.get(s.id) !== false).length ?? 0;
  const totalSources = data?.configured.length ?? 0;

  return (
    <PageShell>
      <PageHeader
        badge="Operations"
        title="Admin dashboard"
        subtitle="Sync job listings from Remotive, Arbeitnow, and optional Adzuna into your database."
        action={
          <Button onClick={() => runSync()} disabled={syncingAll || syncingId !== null}>
            {syncingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync all sources
          </Button>
        }
      />

      <PageContent>
        {message && (
          <p className="mb-6 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground">
            {message}
          </p>
        )}

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total jobs"
            value={isLoading ? '…' : (data?.stats.totalJobs ?? 0)}
            icon={Database}
            iconColor="blue"
          />
          <StatCard
            label="Active sources"
            value={isLoading ? '…' : `${activeSources}/${totalSources}`}
            hint="API-connected"
            icon={Zap}
            iconColor="purple"
          />
          <StatCard
            label="Companies"
            value={isLoading ? '…' : (data?.stats.companyCount ?? 0)}
            icon={CheckCircle}
            iconColor="green"
          />
          <StatCard
            label="Locations"
            value={isLoading ? '…' : (data?.stats.locationCount ?? 0)}
            icon={AlertCircle}
            iconColor="amber"
          />
        </div>

        <SectionCard title="Job sources (APIs)" className="mb-10">
          <p className="mb-6 text-sm text-muted-foreground">
            We use official public APIs—not scraping—so listings stay reliable and within each
            provider&apos;s terms. Add{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ADZUNA_APP_ID</code> and{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">ADZUNA_APP_KEY</code> in{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">.env.local</code> for Adzuna.
          </p>

          {isLoading && (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          <div className="space-y-4">
            {data?.sources.map((source) => {
              const configured = configuredMap.get(source.id) ?? false;
              const status = sourceStatus(source, syncingId);
              const isSyncing = syncingId === source.id;

              return (
                <div
                  key={source.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-5 sm:p-6"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">{source.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {configured ? 'API' : 'Not configured'} · Last sync:{' '}
                        {formatWhen(source.lastSyncAt)}
                      </p>
                      {source.lastError && (
                        <p className="mt-1 text-sm text-destructive">{source.lastError}</p>
                      )}
                    </div>
                    <StatusBadge status={status} configured={configured} />
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4 border-b border-border/60 pb-4 md:grid-cols-3">
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Jobs in DB</p>
                      <p className="text-xl font-bold">{source.jobCount}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Provider ID</p>
                      <p className="font-mono text-sm">{source.id}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-muted-foreground">Kind</p>
                      <p className="text-sm font-medium capitalize">{source.kind}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={!configured || syncingAll || isSyncing}
                    onClick={() => runSync(source.id)}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Sync {source.name}
                  </Button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Recent sync logs">
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">When</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Added</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {(data?.logs.length ?? 0) === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No sync logs yet. Run a sync above.
                    </td>
                  </tr>
                ) : (
                  data?.logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/60 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 text-sm font-medium">{log.source.name}</td>
                      <td className="px-4 py-3 text-sm capitalize">{log.status}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatWhen(log.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{log.jobsAdded}</td>
                      <td className="px-4 py-3 text-center text-sm">{log.jobsUpdated}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </PageContent>
    </PageShell>
  );
}

function StatusBadge({
  status,
  configured,
}: {
  status: string;
  configured: boolean;
}) {
  if (!configured) {
    return (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        Needs API keys
      </span>
    );
  }
  if (status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Syncing
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-400">
        Error
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      Idle
    </span>
  );
}
