'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { JobCard } from '@/components/job-card';
import type { Job } from '@/lib/jobs/types';

/** Compact cards with title, company, meta — taller than a single line. */
const ROW_HEIGHT_ESTIMATE = 124;
/** Default browse loads ≤40 rows; keep a plain list to avoid virtual measure glitches. */
const VIRTUALIZE_MIN = 80;

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
  selectHandlers,
}: Omit<JobsFlatVirtualListProps, 'freezeLayout'> & {
  selectHandlers: Map<string, () => void>;
}) {
  return (
    <ul className="space-y-0.5 p-1">
      {jobs.map((job) => (
        <li key={job.id}>
          <JobCard
            job={job}
            compact
            isSelected={job.id === selectedJobId}
            onJobSelect={selectHandlers.get(job.id) ?? (() => onJobSelect(job))}
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
      const el = anchorRef.current?.closest('[data-jobs-list-scroll]');
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

  const selectHandlers = useMemo(() => {
    const map = new Map<string, () => void>();
    for (const job of jobs) {
      map.set(job.id, () => onJobSelect(job));
    }
    return map;
  }, [jobs, onJobSelect]);

  const virtualizer = useVirtualizer({
    count: useVirtual ? jobs.length : 0,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT_ESTIMATE,
    overscan: 6,
    measureElement: (element) => element.getBoundingClientRect().height,
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
          selectHandlers={selectHandlers}
        />
      </div>
    );
  }

  return (
    <div ref={anchorRef}>
      <ul
        className="relative w-full p-1"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const job = jobs[virtualRow.index];
          if (!job) return null;
          return (
            <li
              key={job.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <JobCard
                job={job}
                compact
                isSelected={job.id === selectedJobId}
                onJobSelect={selectHandlers.get(job.id) ?? (() => onJobSelect(job))}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
