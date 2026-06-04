'use client';

import type { ReactNode } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';

const PANEL_STORAGE_KEY = 'whatsmyjob-jobs-board-v1';

type JobsResizableLayoutProps = {
  filters: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  className?: string;
};

export function JobsResizableLayout({
  filters,
  list,
  detail,
  className,
}: JobsResizableLayoutProps) {
  return (
    <ResizablePanelGroup
      autoSaveId={PANEL_STORAGE_KEY}
      direction="horizontal"
      className={cn('min-h-0 flex-1', className)}
    >
      <ResizablePanel
        id="filters"
        defaultSize={20}
        minSize={14}
        maxSize={32}
        className="min-w-0"
      >
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          {filters}
        </div>
      </ResizablePanel>

      <ResizableHandle
        withHandle
        className="w-1.5 bg-border/80 transition-colors hover:bg-primary/25 active:bg-primary/35"
      />

      <ResizablePanel id="list" defaultSize={34} minSize={22} maxSize={55} className="min-w-0">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">{list}</div>
      </ResizablePanel>

      <ResizableHandle
        withHandle
        className="w-1.5 bg-border/80 transition-colors hover:bg-primary/25 active:bg-primary/35"
      />

      <ResizablePanel id="detail" defaultSize={46} minSize={28} className="min-w-0">
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
          {detail}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
