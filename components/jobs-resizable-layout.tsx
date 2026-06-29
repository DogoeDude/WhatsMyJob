'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type JobsResizableLayoutProps = {
  filters: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  className?: string;
};

const LEGACY_PANEL_KEYS = [
  'react-resizable-panels:whatsmyjob-jobs-board-v1',
  'react-resizable-panels:whatsmyjob-jobs-board-v2',
  'react-resizable-panels:layout:whatsmyjob-jobs-board-v1',
  'react-resizable-panels:layout:whatsmyjob-jobs-board-v2',
];

/** Clear saved panel sizes from older builds that could hide the list column. */
export function clearLegacyJobsPanelLayout() {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_PANEL_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Three-column jobs board: filters | list | detail.
 * Fixed columns on each load so refresh always shows postings (no persisted collapse).
 */
export function JobsResizableLayout({
  filters,
  list,
  detail,
  className,
}: JobsResizableLayoutProps) {
  return (
    <div className={cn('flex h-full min-h-0 w-full flex-1 gap-2 p-2 sm:p-3', className)}>
      <aside className="win-surface flex h-full w-[min(100%,18rem)] min-w-[14rem] max-w-[20rem] shrink-0 flex-col overflow-hidden rounded-lg">
        {filters}
      </aside>
      <div className="win-surface flex min-h-0 min-w-[12rem] flex-[0.9] flex-col overflow-hidden rounded-lg">
        {list}
      </div>
      <div className="win-surface flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg">
        {detail}
      </div>
    </div>
  );
}
