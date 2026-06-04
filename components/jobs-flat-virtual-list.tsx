'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JobCard } from '@/components/job-card';
import type { Job } from '@/lib/jobs/types';

const ROW_HEIGHT = 92;
const VIRTUALIZE_MIN = 12;

type JobsFlatVirtualListProps = {
  jobs: Job[];
  selectedJobId?: string | null;
  onJobSelect: (job: Job) => void;
  /** Plain list while fetching — prevents virtual row overlap during updates. */
  freezeLayout?: boolean;
};

function SimpleJobList({
  jobs,
  selectedJobId,
  onJobSelect,
}: Omit<JobsFlatVirtualListProps, 'freezeLayout'>) {
  return (
    <ul className="divide-y divide-border">
      {jobs.map((job) => (
        <li key={job.id}>
          <JobCard
            job={job}
            compact
            isSelected={job.id === selectedJobId}
            onJobSelect={() => onJobSelect(job)}
          />
        </li>
      ))}
    </ul>
  );
}

export function JobsFlatVirtualList({
  jobs,
  selectedJobId,
  onJobSelect,
  freezeLayout = false,
}: JobsFlatVirtualListProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;

    const resolveScrollParent = () => {
      if (cancelled) return;
      const el = anchorRef.current?.closest('[data-jobs-scroll]');
      setScrollElement(el instanceof HTMLElement ? el : null);
    };

    resolveScrollParent();
    const raf = requestAnimationFrame(resolveScrollParent);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [jobs.length, freezeLayout]);

  const useVirtual = !freezeLayout && jobs.length >= VIRTUALIZE_MIN && scrollElement != null;

  const virtualizer = useVirtualizer({
    count: useVirtual ? jobs.length : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
  });

  const virtualizerRef = useRef(virtualizer);
  virtualizerRef.current = virtualizer;

  useEffect(() => {
    if (!scrollElement || !useVirtual) return;
    const observer = new ResizeObserver(() => {
      virtualizerRef.current.measure();
    });
    observer.observe(scrollElement);
    return () => observer.disconnect();
  }, [scrollElement, useVirtual]);

  useLayoutEffect(() => {
    if (useVirtual) {
      virtualizerRef.current.measure();
    }
  }, [jobs, useVirtual]);

  if (!useVirtual) {
    return (
      <div ref={anchorRef}>
        <SimpleJobList
          jobs={jobs}
          selectedJobId={selectedJobId}
          onJobSelect={onJobSelect}
        />
      </div>
    );
  }

  return (
    <div ref={anchorRef}>
      <ul
        className="relative w-full divide-y divide-border"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const job = jobs[virtualRow.index];
          if (!job) return null;
          return (
            <li
              key={job.id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <JobCard
                job={job}
                compact
                isSelected={job.id === selectedJobId}
                onJobSelect={() => onJobSelect(job)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
