'use client';

import dynamic from 'next/dynamic';
import { Briefcase, Loader2 } from 'lucide-react';
import type { Job } from '@/lib/jobs/types';
import { cn } from '@/lib/utils';

function DetailPanelSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-muted/10 text-muted-foreground',
        className
      )}
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="text-sm">Loading job details…</span>
    </div>
  );
}

const JobDetailPanel = dynamic(
  () => import('@/components/job-detail-panel').then((m) => m.JobDetailPanel),
  { loading: () => <DetailPanelSkeleton />, ssr: false }
);

export function JobDetailPanelLazy({
  job,
  className,
  onBack,
}: {
  job: Job | null;
  className?: string;
  onBack?: () => void;
}) {
  if (!job) {
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

  return <JobDetailPanel job={job} className={className} onBack={onBack} />;
}
