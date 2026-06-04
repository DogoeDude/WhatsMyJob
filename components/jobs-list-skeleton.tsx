'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { JobsPane, JobsPaneHeader } from '@/components/jobs-board-layout';

function JobCardSkeleton() {
  return (
    <div className="flex gap-3 px-3 py-3.5 sm:px-4" aria-hidden>
      <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-[58%] max-w-xs" />
          <Skeleton className="h-3 w-14" />
        </div>
        <Skeleton className="h-3.5 w-[40%] max-w-[10rem]" />
        <div className="flex gap-3 pt-0.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function JobDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col p-5 sm:p-6" aria-hidden>
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-2.5">
          <Skeleton className="h-6 w-[70%] max-w-md" />
          <Skeleton className="h-4 w-[45%] max-w-xs" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
      <div className="mt-8 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[85%]" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[78%]" />
      </div>
    </div>
  );
}

type JobsListLoadingProps = {
  count?: number;
};

/** Initial load only — matches list + detail grid columns. */
export function JobsListLoading({ count = 8 }: JobsListLoadingProps) {
  return (
    <>
      <JobsPane
        className="h-full min-h-0 min-w-0 lg:border-r"
        header={
          <JobsPaneHeader>
            <span className="text-xs font-medium text-muted-foreground">
              Loading listings…
            </span>
          </JobsPaneHeader>
        }
      >
        <ul className="divide-y divide-border" role="status" aria-live="polite" aria-busy="true">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <JobCardSkeleton />
            </li>
          ))}
        </ul>
        <span className="sr-only">Loading job listings, please wait.</span>
      </JobsPane>

      <div className="hidden h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card lg:flex">
        <JobsPaneHeader>
          <Skeleton className="h-3 w-24" />
        </JobsPaneHeader>
        <JobDetailSkeleton />
      </div>
    </>
  );
}
