'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Briefcase,
  Building2,
  Clock,
  ExternalLink,
  MessageCircle,
  MessageCircleOff,
} from 'lucide-react';
import { PageContent, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { APPLICATION_STATUSES, statusLabel } from '@/lib/applications/statuses';
import type { ApplicationStats, JobApplicationRecord } from '@/lib/applications/types';
import { cn } from '@/lib/utils';

type ApplicationsDashboardProps = {
  applications: JobApplicationRecord[];
  stats: ApplicationStats;
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    applied: 'bg-muted text-muted-foreground',
    screening: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
    interview: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
    offer: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-destructive/10 text-destructive',
    withdrawn: 'bg-muted text-muted-foreground',
    no_reply: 'bg-amber-500/10 text-amber-800 dark:text-amber-200',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
        styles[status] ?? styles.applied
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function ApplicationRow({
  app,
  onUpdated,
}: {
  app: JobApplicationRecord;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState(app.status);
  const [hasReply, setHasReply] = useState(app.hasReply);
  const [saving, setSaving] = useState(false);

  const save = async (patch: { status?: string; hasReply?: boolean }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Update failed');
      if (patch.status !== undefined) setStatus(patch.status as typeof status);
      if (patch.hasReply !== undefined) setHasReply(patch.hasReply);
      onUpdated();
    } catch {
      /* keep UI state */
    } finally {
      setSaving(false);
    }
  };

  const appliedLabel = format(new Date(app.appliedAt), 'MMM d, yyyy');

  return (
    <article className="rounded-lg border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-foreground">{app.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{app.company}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              Applied {appliedLabel}
            </span>
            {app.source && <span>{app.source}</span>}
            {app.location && <span className="truncate">{app.location}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs',
              hasReply
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
                : 'border-border text-muted-foreground'
            )}
          >
            {hasReply ? (
              <>
                <MessageCircle className="h-3 w-3" aria-hidden />
                Reply received
              </>
            ) : (
              <>
                <MessageCircleOff className="h-3 w-3" aria-hidden />
                No reply yet
              </>
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground">
          Process stage
          <select
            value={status}
            disabled={saving}
            onChange={(e) => void save({ status: e.target.value })}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {APPLICATION_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-foreground sm:mt-5">
          <input
            type="checkbox"
            checked={hasReply}
            disabled={saving}
            onChange={(e) => void save({ hasReply: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          Got a reply
        </label>

        {app.applyUrl && (
          <Button variant="outline" size="sm" className="sm:mt-5 sm:shrink-0" asChild>
            <a href={app.applyUrl} target="_blank" rel="noopener noreferrer">
              View posting
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

export function ApplicationsDashboard({
  applications: initialApplications,
  stats: initialStats,
}: ApplicationsDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');

  const applications = initialApplications;
  const stats = initialStats;

  const filtered = useMemo(() => {
    if (filter === 'all') return applications;
    if (filter === 'awaiting') {
      return applications.filter(
        (a) => !a.hasReply && !['rejected', 'offer', 'withdrawn'].includes(a.status)
      );
    }
    return applications.filter((a) => a.status === filter);
  }, [applications, filter]);

  const pipelineMax = Math.max(1, ...stats.byStatus.map((b) => b.count));

  return (
    <PageShell>
      <PageContent className="max-w-4xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            My applications
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Track where you applied, company, date, replies, and where you are in the process.
          </p>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total applied" value={stats.total} />
          <StatCard label="Awaiting reply" value={stats.awaitingReply} hint="No response yet" />
          <StatCard label="In process" value={stats.inProcess} hint="Screening or interview" />
          <StatCard label="Offers" value={stats.offers} />
        </div>

        {stats.byStatus.length > 0 && (
          <section className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground">Pipeline overview</h2>
            <ul className="mt-4 space-y-2">
              {APPLICATION_STATUSES.map((s) => {
                const count = stats.byStatus.find((b) => b.status === s.id)?.count ?? 0;
                if (count === 0) return null;
                return (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">{s.label}</span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${(count / pipelineMax) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right tabular-nums text-foreground">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'awaiting', label: 'Awaiting reply' },
            ...APPLICATION_STATUSES.filter((s) =>
              stats.byStatus.some((b) => b.status === s.id && b.count > 0)
            ).map((s) => ({ id: s.id, label: s.label })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                filter === tab.id
                  ? 'border-primary/30 bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted/50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No applications yet"
            description="When you apply from the jobs board while signed in, we log the company, role, and date here. You can update status and reply tracking anytime."
            action={
              <Button asChild>
                <a href="/">Browse jobs</a>
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No applications in this filter.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((app) => (
              <li key={app.id}>
                <ApplicationRow app={app} onUpdated={() => router.refresh()} />
              </li>
            ))}
          </ul>
        )}
      </PageContent>
    </PageShell>
  );
}
