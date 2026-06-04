import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClass = {
  sm: 'size-4',
  md: 'size-8',
  lg: 'size-10',
} as const;

export function LoadingSpinner({ label, className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 text-center', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className={sizeClass[size]} />
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
    </div>
  );
}

type LoadingOverlayProps = {
  label?: string;
  className?: string;
};

/** Full-screen loading veil for sign-in, sign-out, and route changes. */
export function LoadingOverlay({ label = 'Loading…', className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex items-center justify-center bg-background/75 backdrop-blur-sm',
        className
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={label}
    >
      <div className="rounded-2xl border border-border bg-card px-8 py-7 shadow-lg">
        <LoadingSpinner label={label} size="lg" />
      </div>
    </div>
  );
}

export function LoadingButtonLabel({
  loading,
  loadingText,
  children,
}: {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
}) {
  if (!loading) return <>{children}</>;
  return (
    <>
      <Spinner className="size-4 shrink-0" />
      {loadingText}
    </>
  );
}
