import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center px-6 py-12 text-center',
        className
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-secondary">
        <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.25} />
      </span>
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
