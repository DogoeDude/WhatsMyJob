'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSession } from '@/lib/use-app-session';
import { isPersistedJobId } from '@/lib/jobs/constants';
import { JobDescriptionContent, JobDetailList } from '@/components/job-description-content';
import { JobDetailHeader } from '@/components/job-detail-header';
import { JobsPaneHeader } from '@/components/jobs-board-layout';
import type { Job } from '@/lib/jobs/types';
import { cn } from '@/lib/utils';

type JobDetailPanelProps = {
  job: Job | null;
  className?: string;
  onBack?: () => void;
};

export function JobDetailPanel({ job, className, onBack }: JobDetailPanelProps) {
  const { data: session } = useAppSession();
  const [details, setDetails] = useState<Job | null>(job);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const trackAndOpenApply = (target: Job) => {
    if (!target.applyUrl) return;
    if (session) {
      void fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobListingId: isPersistedJobId(target.id) ? target.id : undefined,
          title: target.title,
          company: target.company,
          location: target.location,
          applyUrl: target.applyUrl,
          source: target.source,
        }),
      });
    }
    window.open(target.applyUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    setDetails(job);
  }, [job]);

  useEffect(() => {
    if (!job) return;
    if (job.description?.trim()) return;

    let cancelled = false;
    setLoadingDetails(true);

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${job.id}`);
        const data = (await res.json()) as { job?: Job };
        if (!cancelled && res.ok && data.job) {
          setDetails(data.job);
        }
      } catch {
        /* keep list preview */
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [job?.id, job?.description]);

  if (!job || !details) {
    return (
      <div
        className={cn(
          'flex h-full min-h-0 flex-col items-center justify-center bg-muted/10 px-6 text-center',
          className
        )}
      >
        <Briefcase className="mb-4 h-14 w-14 text-muted-foreground/35" aria-hidden />
        <p className="text-base font-medium text-foreground">Select a job</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Choose a role from the list to read the full description and apply.
        </p>
      </div>
    );
  }

  const display = details;

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-card', className)}>
      {onBack && (
        <JobsPaneHeader className="gap-3 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-1 h-9 shrink-0 gap-1.5 px-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="text-sm font-medium">List</span>
          </Button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {display.title}
          </span>
        </JobsPaneHeader>
      )}

      <JobDetailHeader job={display} />

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {display.tags && display.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border px-4 py-2.5 sm:px-5">
            {display.tags.map((tag, index) => (
              <span
                key={`${display.id}-tag-${index}`}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Job description</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Overview, responsibilities, and requirements.
            </p>
          </div>

          {loadingDetails ? (
            <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading full description…
            </div>
          ) : (
            <JobDescriptionContent description={display.description} />
          )}

          {!loadingDetails && (display.requirements.length > 0 || display.benefits.length > 0) && (
            <div className="grid gap-4 border-t border-border pt-6 lg:grid-cols-2">
              {display.requirements.length > 0 && (
                <JobDetailList title="Requirements" items={display.requirements} />
              )}
              {display.benefits.length > 0 && (
                <JobDetailList title="Benefits" items={display.benefits} />
              )}
            </div>
          )}
        </div>
      </div>

      {display.applyUrl ? (
        <div className="shrink-0 border-t border-border bg-muted/25 px-4 py-3 sm:px-5">
          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={() => trackAndOpenApply(display)}
          >
            Apply now
            <ExternalLink className="h-4 w-4" />
          </Button>
          <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
            {session
              ? 'Tracked in Analytics · opens in a new tab'
              : `Opens ${display.source ?? 'employer site'} in a new tab · sign in to track`}
          </p>
        </div>
      ) : (
        <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
          <Button className="w-full" size="lg" disabled>
            No apply link
          </Button>
        </div>
      )}
    </div>
  );
}
