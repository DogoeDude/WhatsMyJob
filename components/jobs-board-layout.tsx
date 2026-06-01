'use client';

import { cn } from '@/lib/utils';

/** Shared pane chrome for sidebar, list, and detail columns. */
export function JobsPane({
  children,
  className,
  header,
  footer,
}: {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card',
        className
      )}
    >
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer}
    </div>
  );
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
        'flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2',
        className
      )}
    >
      {children}
    </div>
  );
}
