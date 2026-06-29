import { Badge } from '@/components/ui/badge';
import {
  getJobRecencyFlag,
  jobRecencyBadgeClass,
  type JobRecencyFlag,
} from '@/lib/jobs/recency';
import { cn } from '@/lib/utils';

export function JobRecencyBadge({
  postedAtMs,
  flag,
  className,
}: {
  postedAtMs?: number;
  /** Precomputed flag (avoids duplicate work in virtual lists). */
  flag?: JobRecencyFlag | null;
  className?: string;
}) {
  const recency = flag ?? getJobRecencyFlag(postedAtMs);
  if (!recency) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-5 shrink-0 px-1.5 text-[10px] font-medium uppercase tracking-wide',
        jobRecencyBadgeClass[recency.variant],
        className
      )}
    >
      {recency.label}
    </Badge>
  );
}
