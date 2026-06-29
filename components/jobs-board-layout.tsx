'use client';

import { cn } from '@/lib/utils';

export type JobsPaneScrollRegion = 'list' | 'filters' | 'none';

const SCROLL_REGION_ATTR: Record<Exclude<JobsPaneScrollRegion, 'none'>, string> = {
  list: 'data-jobs-list-scroll',
  filters: 'data-jobs-filters-scroll',
};

/** Shared pane chrome for sidebar, list, and detail columns. */
export function JobsPane({
  children,
  className,
  header,
  footer,
  scrollRegion = 'list',
}: {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  /** Which scroll container this pane is — keeps list vs filters restoration separate. */
  scrollRegion?: JobsPaneScrollRegion;
}) {
  const scrollProps =
    scrollRegion === 'none'
      ? {}
      : { [SCROLL_REGION_ATTR[scrollRegion]]: '' };

  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-transparent',
        className
      )}
    >
      {header}
      <div
        {...scrollProps}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {children}
      </div>
      {footer}
    </div>
  );
}

/** Scroll the job list column back to the first posting (e.g. after full page reload). */
export function resetJobsListScroll() {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-jobs-list-scroll]').forEach((node) => {
    if (node instanceof HTMLElement) node.scrollTop = 0;
  });
}

export function JobsPaneHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between gap-2 border-b border-border bg-secondary px-3 py-2',
        className
      )}
    >
      {children}
    </div>
  );
}
